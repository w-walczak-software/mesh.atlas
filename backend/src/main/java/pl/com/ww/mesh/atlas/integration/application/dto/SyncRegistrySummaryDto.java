package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.time.LocalDateTime;
import java.util.UUID;

public record SyncRegistrySummaryDto(
        UUID id,
        UUID pipelineId,
        String pipelineCode,
        String pipelineName,
        TargetEntityType pipelineTargetEntity,
        SyncStatus status,
        String executedBy,
        LocalDateTime executedAt,
        LocalDateTime completedAt,
        int totalCount,
        int successCount,
        int failedCount,
        int skippedCount
) {}
