package pl.com.ww.mesh.atlas.api.application.dto;

public record ApiEnvironmentHistoryDto(
        long revisionNumber,
        String revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        String environmentCode,
        String environmentName,
        String serviceUrl
) {}
