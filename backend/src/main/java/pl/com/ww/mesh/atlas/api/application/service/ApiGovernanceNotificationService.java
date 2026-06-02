package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateProcessingService;
import pl.com.ww.mesh.atlas.global.GovernanceService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiGovernanceNotificationService {

    static final String TEMPLATE_CREATED = "GOVERNANCE_API_CREATED";
    static final String TEMPLATE_MODIFIED = "GOVERNANCE_API_MODIFIED";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final GovernanceService governanceService;
    private final EmailTemplateProcessingService templateService;
    private final EmailService emailService;

    /**
     * Listens for ApiGovernanceEvent published within a transaction.
     * Runs AFTER the transaction commits — guarantees email is sent only on success,
     * and that async execution reads committed data.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGovernanceEvent(ApiGovernanceEvent event) {
        Set<String> verifierEmails = governanceService.getVerifierEmailsForSystem(event.producerSystemId());
        if (verifierEmails.isEmpty()) {
            log.debug("No verifiers found for system {} — governance notification skipped", event.producerSystemId());
            return;
        }

        Map<String, Object> vars = Map.of(
                "apiCode",            event.apiCode(),
                "apiName",            event.apiName(),
                "apiVersion",         event.apiVersion() != null ? event.apiVersion() : "–",
                "producerSystemName", event.producerSystemName() != null ? event.producerSystemName() : "–",
                "changedBy",          event.changedBy(),
                "changedAt",          event.changedAt() != null ? event.changedAt().format(FORMATTER) : "–"
        );

        String body;
        try {
            body = templateService.processByCode(event.templateCode(), vars);
        } catch (Exception e) {
            log.warn("Governance email template '{}' not found or inactive — notification skipped", event.templateCode());
            return;
        }

        for (String email : verifierEmails) {
            try {
                emailService.sendEmail(email, event.subject(), body, false);
                log.info("Governance notification sent to {} for API {}", email, event.apiCode());
            } catch (Exception e) {
                log.warn("Failed to send governance notification to {}: {}", email, e.getMessage());
            }
        }
    }

    public ApiGovernanceEvent buildCreateEvent(UUID producerSystemId, String producerSystemName,
                                               String apiCode, String apiName, String apiVersion,
                                               String changedBy, LocalDateTime changedAt) {
        return new ApiGovernanceEvent(
                TEMPLATE_CREATED,
                "[mesh.atlas] Nowe API \"%s\" oczekuje na weryfikację".formatted(apiName),
                producerSystemId, producerSystemName,
                apiCode, apiName, apiVersion, changedBy, changedAt);
    }

    public ApiGovernanceEvent buildModifyEvent(UUID producerSystemId, String producerSystemName,
                                               String apiCode, String apiName, String apiVersion,
                                               String changedBy, LocalDateTime changedAt) {
        return new ApiGovernanceEvent(
                TEMPLATE_MODIFIED,
                "[mesh.atlas] Modyfikacja API \"%s\" oczekuje na weryfikację".formatted(apiName),
                producerSystemId, producerSystemName,
                apiCode, apiName, apiVersion, changedBy, changedAt);
    }
}
