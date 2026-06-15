package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.time.LocalDateTime;
import java.util.UUID;

public record IntegrationPipelineDto(
        UUID id,
        String code,
        String name,
        String description,
        PipelineStatus status,
        TargetEntityType targetEntity,
        IntegrationDatasourceSummaryDto datasource,
        boolean hasDsl,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
