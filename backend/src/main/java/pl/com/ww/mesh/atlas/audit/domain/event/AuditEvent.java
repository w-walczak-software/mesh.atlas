package pl.com.ww.mesh.atlas.audit.domain.event;

import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditOutcome;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditSeverity;

import java.util.Map;

public record AuditEvent(
        AuditCategory category,
        AuditAction action,
        AuditResourceType resourceType,
        String resourceId,
        String resourceName,
        AuditOutcome outcome,
        AuditSeverity severity,
        String message,
        Map<String, Object> context,
        String errorDetail,
        // Actor info captured at publish time from UserContextHolder (main-thread ThreadLocal)
        String actorId,
        String actorUsername,
        String actorEmail
) {

    public static AuditEvent success(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String actorId,
            String actorEmail) {
        return new AuditEvent(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.SUCCESS, AuditSeverity.INFO,
                null, null, null,
                actorId, actorEmail, actorEmail);
    }

    public static AuditEvent success(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String message,
            Map<String, Object> context,
            AuditSeverity severity,
            String actorId,
            String actorEmail) {
        return new AuditEvent(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.SUCCESS, severity,
                message, context, null,
                actorId, actorEmail, actorEmail);
    }

    public static AuditEvent failure(
            AuditCategory category,
            AuditAction action,
            AuditResourceType resourceType,
            String resourceId,
            String resourceName,
            String errorDetail,
            String actorId,
            String actorEmail) {
        return new AuditEvent(category, action, resourceType, resourceId, resourceName,
                AuditOutcome.FAILURE, AuditSeverity.WARNING,
                null, null, errorDetail,
                actorId, actorEmail, actorEmail);
    }
}
