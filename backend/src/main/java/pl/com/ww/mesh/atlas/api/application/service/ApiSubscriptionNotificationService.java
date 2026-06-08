package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiSubscriptionRepository;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateProcessingService;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiSubscriptionNotificationService {

    static final String TEMPLATE_CODE = "API_CHANGE_NOTIFICATION";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ApiSubscriptionRepository subscriptionRepository;
    private final EmailTemplateProcessingService templateService;
    private final EmailService emailService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onApiChange(ApiSubscriptionChangeEvent event) {
        var subscribers = subscriptionRepository.findActiveNotifiableByApiId(event.apiId());
        if (subscribers.isEmpty()) {
            log.debug("No active subscribers for API {} — notification skipped", event.apiCode());
            return;
        }

        Map<String, Object> vars = Map.of(
                "apiCode",            event.apiCode(),
                "apiName",            event.apiName(),
                "apiVersion",         event.apiVersion() != null ? event.apiVersion() : "",
                "producerSystemName", event.producerSystemName() != null ? event.producerSystemName() : "",
                "changeType",         event.changeType(),
                "changedBy",          event.changedBy(),
                "changedAt",          event.changedAt() != null ? event.changedAt().format(FORMATTER) : "–"
        );

        String body;
        try {
            body = templateService.processByCode(TEMPLATE_CODE, vars);
        } catch (Exception e) {
            log.warn("Email template '{}' not found or inactive — subscription notification skipped", TEMPLATE_CODE);
            return;
        }

        String subject = "[mesh.atlas] Zmiana API: %s".formatted(event.apiName());

        for (var subscriber : subscribers) {
            try {
                emailService.sendEmail(subscriber.getSubscriberEmail(), subject, body, false);
                log.info("Subscription notification sent to {} for API {}", subscriber.getSubscriberEmail(), event.apiCode());
            } catch (Exception e) {
                log.warn("Failed to send subscription notification to {}: {}",
                        subscriber.getSubscriberEmail(), e.getMessage());
            }
        }
    }
}
