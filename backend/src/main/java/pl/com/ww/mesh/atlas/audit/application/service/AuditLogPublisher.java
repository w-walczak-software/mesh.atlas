package pl.com.ww.mesh.atlas.audit.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import pl.com.ww.mesh.atlas.audit.domain.event.AuditEvent;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditOutcome;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditSeverity;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.util.Map;

/**
 * Programmatic API for publishing audit events.
 * Captures actor from UserContextHolder at call time (main-thread ThreadLocal).
 * Use @AuditLogged for declarative annotation-driven logging on service methods.
 */
@Service
@RequiredArgsConstructor
public class AuditLogPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public void publishSuccess(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName) {
        publish(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.SUCCESS, AuditSeverity.INFO, null, null, null);
    }

    public void publishSuccess(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String message,
            Map<String, Object> context) {
        publish(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.SUCCESS, AuditSeverity.INFO, message, context, null);
    }

    public void publishWarning(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String message) {
        publish(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.SUCCESS, AuditSeverity.WARNING, message, null, null);
    }

    public void publishFailure(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String errorDetail) {
        publish(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.FAILURE, AuditSeverity.WARNING, null, null, errorDetail);
    }

    public void publish(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            AuditOutcome outcome,
            AuditSeverity severity,
            String message,
            Map<String, Object> context,
            String errorDetail) {
        AuthenticatedUser actor = UserContextHolder.getCurrentUserOptional().orElse(null);
        eventPublisher.publishEvent(new AuditEvent(
                category, action, resourceType, resourceId, resourceName,
                outcome, severity, message, context, errorDetail,
                actor != null ? actor.id() : null,
                actor != null ? actor.email() : "system",
                actor != null ? actor.email() : null
        ));
    }
}
