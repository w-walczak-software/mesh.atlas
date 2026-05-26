package pl.com.ww.mesh.atlas.api.application.dto;

public record ApiConsumerSystemHistoryDto(
        long revisionNumber,
        String revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        String systemId,
        String systemCode,
        String systemName,
        String systemIcon
) {}
