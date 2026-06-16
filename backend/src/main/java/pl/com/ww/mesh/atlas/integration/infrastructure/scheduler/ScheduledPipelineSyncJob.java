package pl.com.ww.mesh.atlas.integration.infrastructure.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import pl.com.ww.mesh.atlas.integration.application.service.SyncExecutionService;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationPipelineNotActiveException;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationSyncAlreadyRunningException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.IntegrationPipelineRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Quartz job that fires scheduled pipeline syncs.
 * Field injection is required here because Quartz controls instantiation;
 * Spring Boot's SpringBeanJobFactory auto-wires these fields after creation.
 * @DisallowConcurrentExecution prevents the same pipeline from overlapping across cluster nodes.
 */
@Slf4j
@DisallowConcurrentExecution
public class ScheduledPipelineSyncJob implements Job {

    @Autowired
    private SyncExecutionService syncExecutionService;

    @Autowired
    private IntegrationPipelineRepository pipelineRepository;

    @Autowired
    private PipelineSchedulerService schedulerService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        String pipelineIdStr = context.getJobDetail().getJobDataMap().getString("pipelineId");
        UUID pipelineId = UUID.fromString(pipelineIdStr);

        Optional<IntegrationPipelineEntity> pipelineOpt = pipelineRepository.findById(pipelineId);
        if (pipelineOpt.isEmpty()) {
            log.warn("Scheduled sync skipped — pipeline {} not found", pipelineId);
            return;
        }

        IntegrationPipelineEntity pipeline = pipelineOpt.get();
        TargetEntityType entityType = pipeline.getTargetEntity();

        log.info("Scheduled sync starting for pipeline {} ({})", pipeline.getCode(), entityType);

        schedulerService.waitForPrerequisites(entityType);

        try {
            syncExecutionService.triggerSync(pipelineId, "SCHEDULER");
            log.info("Scheduled sync triggered for pipeline {}", pipeline.getCode());
        } catch (IntegrationPipelineNotActiveException e) {
            log.warn("Scheduled sync skipped — pipeline {} is not ACTIVE", pipeline.getCode());
        } catch (IntegrationSyncAlreadyRunningException e) {
            log.warn("Scheduled sync skipped — pipeline {} already has a running sync", pipeline.getCode());
        } catch (Exception e) {
            log.error("Scheduled sync failed for pipeline {}: {}", pipeline.getCode(), e.getMessage(), e);
            throw new JobExecutionException(e, false);
        } finally {
            schedulerService.refreshNextExecutionAt(pipelineId);
        }
    }
}
