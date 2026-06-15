package pl.com.ww.mesh.atlas.integration.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record IntegrationDatasourceUpdateRequest(
        @NotBlank @Size(max = 255)
        String name,

        String description,

        @NotBlank @Size(max = 500)
        String host,

        @NotNull @Min(1) @Max(65535)
        Integer port,

        @NotBlank @Size(max = 255)
        String databaseName,

        @NotBlank @Size(max = 255)
        String username,

        String password
) {}
