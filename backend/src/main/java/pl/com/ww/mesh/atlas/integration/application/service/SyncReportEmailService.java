package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateProcessingService;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;
import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterEntity;
import pl.com.ww.mesh.atlas.systemparameter.infrastructure.persistence.SystemParameterRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncReportEmailService {

    private static final String TEMPLATE_CODE = "SYNC_EXECUTION_REPORT";
    private static final String PARAM_KEY = "SYNC_ADMIN_NOTIFICATION_EMAILS";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final SyncRegistryRepository syncRegistryRepository;
    private final SystemParameterRepository systemParameterRepository;
    private final EmailTemplateProcessingService templateProcessingService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public void sendSyncReport(UUID registryId) {
        List<String> recipients = resolveRecipients();
        if (recipients.isEmpty()) {
            log.debug("No admin notification emails configured — skipping sync report for registry {}", registryId);
            return;
        }

        SyncRegistryEntity registry = syncRegistryRepository.findById(registryId).orElse(null);
        if (registry == null) {
            log.warn("Cannot send sync report — registry {} not found", registryId);
            return;
        }

        Map<String, Object> vars = buildVariables(registry);
        String body;
        try {
            body = templateProcessingService.processByCode(TEMPLATE_CODE, vars);
        } catch (Exception e) {
            log.error("Failed to process sync report email template for registry {}: {}", registryId, e.getMessage(), e);
            return;
        }

        String subject = "Raport synchronizacji — " + registry.getPipeline().getCode()
                + " — " + registry.getStatus().name();

        for (String email : recipients) {
            try {
                emailService.sendEmail(email, subject, body, false);
                log.debug("Sync report sent to {} for pipeline {}", email, registry.getPipeline().getCode());
            } catch (Exception e) {
                log.warn("Failed to send sync report to {}: {}", email, e.getMessage());
            }
        }
    }

    private List<String> resolveRecipients() {
        return systemParameterRepository.findByParameterKey(PARAM_KEY)
                .map(SystemParameterEntity::getStringValue)
                .filter(s -> s != null && !s.isBlank())
                .map(csv -> Arrays.stream(csv.split(","))
                        .map(String::trim)
                        .filter(e -> !e.isBlank())
                        .toList())
                .orElse(List.of());
    }

    private Map<String, Object> buildVariables(SyncRegistryEntity registry) {
        var pipeline = registry.getPipeline();
        String duration = formatDuration(registry.getExecutedAt(), registry.getCompletedAt());
        return Map.ofEntries(
                Map.entry("pipelineCode", pipeline.getCode()),
                Map.entry("pipelineName", pipeline.getName()),
                Map.entry("targetEntity", pipeline.getTargetEntity().name()),
                Map.entry("status", registry.getStatus().name()),
                Map.entry("executedBy", registry.getExecutedBy()),
                Map.entry("executedAt", format(registry.getExecutedAt())),
                Map.entry("completedAt", registry.getCompletedAt() != null ? format(registry.getCompletedAt()) : "—"),
                Map.entry("duration", duration),
                Map.entry("totalCount", registry.getTotalCount()),
                Map.entry("successCount", registry.getSuccessCount()),
                Map.entry("failedCount", registry.getFailedCount()),
                Map.entry("skippedCount", registry.getSkippedCount())
        );
    }

    private String format(LocalDateTime dt) {
        return dt != null ? dt.format(FORMATTER) : "—";
    }

    private String formatDuration(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return "—";
        Duration d = Duration.between(start, end);
        long mins = d.toMinutes();
        long secs = d.toSecondsPart();
        return mins > 0 ? mins + " min " + secs + " s" : secs + " s";
    }
}
