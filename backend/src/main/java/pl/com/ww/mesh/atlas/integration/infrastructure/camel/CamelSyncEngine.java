package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.camel.CamelContext;
import org.apache.camel.component.sql.SqlComponent;
import org.apache.camel.impl.DefaultCamelContext;
import org.apache.camel.spi.CamelEvent;
import org.apache.camel.spi.Resource;
import org.apache.camel.support.EventNotifierSupport;
import org.apache.camel.support.PluginHelper;
import org.apache.camel.support.ResourceHelper;
import org.apache.camel.support.SimpleRegistry;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.infrastructure.encryption.IntegrationEncryptionService;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.PipelineDictionaryMappingRepository;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
@RequiredArgsConstructor
public class CamelSyncEngine {

    private final DataSource mainDataSource;
    private final PipelineDictionaryMappingRepository mappingRepository;
    private final IntegrationEncryptionService encryptionService;

    public SyncExecutionResult execute(IntegrationPipelineEntity pipeline, UUID syncRegistryId) {
        String dsl = pipeline.getCamelXmlDsl();
        if (dsl == null || dsl.isBlank()) {
            return new SyncExecutionResult(false, "", "No Camel XML DSL defined for pipeline: " + pipeline.getCode());
        }

        UUID saltId = UUID.nameUUIDFromBytes(
                pipeline.getDatasource().getCode().getBytes(StandardCharsets.UTF_8));
        String plainPassword = encryptionService.decrypt(
                pipeline.getDatasource().getEncryptedPassword(),
                saltId
        );
        HikariDataSource sourceDs = null;
        CamelContext context = null;
        StringBuilder executionLog = new StringBuilder();

        try {
            sourceDs = DynamicDataSourceFactory.build(pipeline.getDatasource(), plainPassword);
            CamelDictionaryMapper dictMapper = new CamelDictionaryMapper(
                    mappingRepository.findAllByPipelineIdAndExternalValueIsNotNull(pipeline.getId()));

            SimpleRegistry registry = new SimpleRegistry();
            registry.bind("sourceDataSource", sourceDs);
            registry.bind("targetDataSource", mainDataSource);
            registry.bind("camelDictionaryMapper", dictMapper);
            registry.bind("pipelineId", pipeline.getId());
            registry.bind("syncRegistryId", syncRegistryId);

            DefaultCamelContext camelCtx = new DefaultCamelContext(registry);
            camelCtx.disableJMX();

            SqlComponent sqlComponent = new SqlComponent();
            sqlComponent.setDataSource(mainDataSource);
            camelCtx.addComponent("sql", sqlComponent);

            SyncEventNotifier monitor = new SyncEventNotifier(executionLog, log);
            camelCtx.getManagementStrategy().addEventNotifier(monitor);

            context = camelCtx;

            Resource resource = ResourceHelper.fromString(
                    "memory:pipeline-" + pipeline.getCode() + ".xml", dsl);
            PluginHelper.getRoutesLoader(context).loadRoutes(resource);

            executionLog.append("Pipeline  : ").append(pipeline.getCode()).append("\n");
            executionLog.append("Registry  : ").append(syncRegistryId).append("\n");
            executionLog.append("---\n");

            context.start();

            boolean completed = waitForCompletion(context, Duration.ofMinutes(30));
            context.stop();

            boolean hasFailures = monitor.getFailCount() > 0;
            String resultLabel = !completed ? "TIMED OUT" : hasFailures ? "FAILED" : "COMPLETED";
            String errorMessage = !completed ? "Execution timed out after 30 minutes"
                    : hasFailures ? monitor.getFailCount() + " row(s) failed during sync"
                    : null;

            executionLog.append("---\n");
            executionLog.append(String.format("SELECT rows : %d%n", monitor.getSelectRows()));
            executionLog.append(String.format("INSERT ok   : %d%n", monitor.getInsertCount()));
            executionLog.append(String.format("Failures    : %d%n", monitor.getFailCount()));
            executionLog.append("Result: ").append(resultLabel).append("\n");

            return new SyncExecutionResult(completed && !hasFailures, executionLog.toString(), errorMessage);

        } catch (Exception e) {
            log.error("Camel execution failed for pipeline {}", pipeline.getCode(), e);
            executionLog.append("ERROR: ").append(e.getMessage()).append("\n");
            return new SyncExecutionResult(false, executionLog.toString(), e.getMessage());
        } finally {
            if (context != null && context.isStarted()) {
                try { context.stop(); } catch (Exception ignored) {}
            }
            if (sourceDs != null) {
                DynamicDataSourceFactory.close(sourceDs);
            }
        }
    }

    private boolean waitForCompletion(CamelContext context, Duration timeout) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            if (!context.isStarted() || context.getRoutes().isEmpty()) {
                return true;
            }
            long inflight = context.getInflightRepository().size();
            if (inflight == 0) {
                TimeUnit.SECONDS.sleep(2);
                if (context.getInflightRepository().size() == 0) {
                    return true;
                }
            }
            TimeUnit.SECONDS.sleep(5);
        }
        return false;
    }

    // ── Event notifier ────────────────────────────────────────────────────────

    private static final class SyncEventNotifier extends EventNotifierSupport {

        private final StringBuilder executionLog;
        private final Logger logger;
        private final AtomicInteger selectRows = new AtomicInteger(-1);
        private final AtomicInteger insertCount = new AtomicInteger(0);
        private final AtomicInteger failCount   = new AtomicInteger(0);

        SyncEventNotifier(StringBuilder executionLog, Logger logger) {
            this.executionLog = executionLog;
            this.logger       = logger;
            setIgnoreCamelContextEvents(true);
            setIgnoreRouteEvents(true);
            setIgnoreServiceEvents(true);
        }

        @Override
        public void notify(CamelEvent event) {
            try {
                if (event instanceof CamelEvent.ExchangeSentEvent e) {
                    onSent(e);
                } else if (event instanceof CamelEvent.ExchangeFailedEvent e) {
                    onFailed(e);
                }
            } catch (Exception ignored) {}
        }

        private void onSent(CamelEvent.ExchangeSentEvent e) {
            String uri = e.getEndpoint().getEndpointUri();

            if (uri.startsWith("jdbc:")) {
                Object body = e.getExchange().getMessage().getBody();
                int rows = body instanceof List<?> list ? list.size() : -1;
                selectRows.set(rows);

                String columns = "";
                if (body instanceof List<?> list && !list.isEmpty()
                        && list.getFirst() instanceof Map<?, ?> row) {
                    columns = ", columns=" + row.keySet();
                }
                String msg = String.format("  [SELECT] %s → rows=%d%s, elapsed=%dms",
                        abbreviate(uri), rows, columns, e.getTimeTaken());
                executionLog.append(msg).append("\n");
                logger.info("[Camel] {}", msg);

            } else if (uri.startsWith("sql:")) {
                int n = insertCount.incrementAndGet();
                String msg = String.format("  [INSERT] #%d → elapsed=%dms", n, e.getTimeTaken());
                executionLog.append(msg).append("\n");
                logger.debug("[Camel] {}", msg);
            }
        }

        private void onFailed(CamelEvent.ExchangeFailedEvent e) {
            int n = failCount.incrementAndGet();
            Throwable ex = e.getExchange().getException();
            String cause = ex != null ? ex.getMessage() : "unknown error";

            String bodyPreview = "";
            try {
                Object body = e.getExchange().getMessage().getBody();
                if (body != null) {
                    String s = body.toString();
                    bodyPreview = ", body=" + (s.length() > 200 ? s.substring(0, 200) + "..." : s);
                }
            } catch (Exception ignored) {}

            String msg = String.format("  [FAIL] #%d → %s%s", n, cause, bodyPreview);
            executionLog.append(msg).append("\n");
            logger.error("[Camel] {}", msg);
        }

        @Override
        public boolean isEnabled(CamelEvent event) {
            return event instanceof CamelEvent.ExchangeSentEvent
                    || event instanceof CamelEvent.ExchangeFailedEvent;
        }

        private static String abbreviate(String s) {
            return s.length() > 80 ? s.substring(0, 80) + "..." : s;
        }

        int getSelectRows()  { return selectRows.get(); }
        int getInsertCount() { return insertCount.get(); }
        int getFailCount()   { return failCount.get(); }
    }
}
