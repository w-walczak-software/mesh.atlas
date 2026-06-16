package pl.com.ww.mesh.atlas.integration.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.util.UUID;

public record IntegrationPipelineCreateRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "^[A-Z][A-Z0-9_]*$")
        String code,

        @NotBlank @Size(max = 255)
        String name,

        String description,

        @NotNull
        UUID datasourceId,

        @NotNull
        TargetEntityType targetEntity,

        @Size(max = 100)
        String cronExpression,

        boolean scheduleEnabled
) {}
