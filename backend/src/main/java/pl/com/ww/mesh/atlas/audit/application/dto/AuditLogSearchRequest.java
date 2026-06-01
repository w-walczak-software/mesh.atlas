package pl.com.ww.mesh.atlas.audit.application.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

public record AuditLogSearchRequest(
        String actorUsername,
        String category,
        String action,
        String resourceType,
        String outcome,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        LocalDateTime startDate,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        LocalDateTime endDate
) {}
