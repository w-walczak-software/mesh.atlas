package pl.com.ww.mesh.atlas.audit.application.dto;

import java.util.Map;
import java.util.UUID;

public record AuditLogEntryDto(
        UUID id,
        String eventTime,
        String category,
        String action,
        String resourceType,
        String resourceId,
        String resourceName,
        String actorId,
        String actorUsername,
        String actorEmail,
        String outcome,
        String severity,
        String message,
        Map<String, Object> context,
        String errorDetail
) {}
