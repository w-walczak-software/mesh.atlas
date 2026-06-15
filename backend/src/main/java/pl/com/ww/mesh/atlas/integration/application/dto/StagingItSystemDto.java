package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record StagingItSystemDto(
        UUID id,
        String externalId,
        String code,
        String name,
        String rawStatus,
        String rawLifecycleStage,
        String rawBusinessCriticality,
        String rawSystemType,
        StagingStatus stagingStatus,
        String errorMessage,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {}
