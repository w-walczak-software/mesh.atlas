package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.util.UUID;

public record IntegrationPipelineSummaryDto(
        UUID id,
        String code,
        String name,
        PipelineStatus status,
        TargetEntityType targetEntity,
        UUID datasourceId,
        String datasourceName,
        boolean active
) {}
