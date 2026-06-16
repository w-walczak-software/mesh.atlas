package pl.com.ww.mesh.atlas.integration.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;

import java.util.UUID;

public record IntegrationPipelineUpdateRequest(
        @NotBlank @Size(max = 255)
        String name,

        String description,

        @NotNull
        UUID datasourceId,

        @NotNull
        PipelineStatus status,

        @Size(max = 100)
        String cronExpression,

        boolean scheduleEnabled
) {}
