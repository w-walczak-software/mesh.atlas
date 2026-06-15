package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record StagingApiDto(
        UUID id,
        String externalId,
        String code,
        String name,
        String apiVersion,
        String rawStatus,
        String rawType,
        String rawProtocol,
        StagingStatus stagingStatus,
        String errorMessage,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {}
