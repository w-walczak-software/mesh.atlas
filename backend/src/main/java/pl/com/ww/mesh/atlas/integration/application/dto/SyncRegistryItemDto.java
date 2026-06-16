package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncAction;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.time.LocalDateTime;
import java.util.UUID;

public record SyncRegistryItemDto(
        UUID id,
        TargetEntityType entityType,
        String externalId,
        UUID targetId,
        String targetCode,
        String targetName,
        SyncAction action,
        StagingStatus status,
        String errorMessage,
        LocalDateTime createdAt
) {}
