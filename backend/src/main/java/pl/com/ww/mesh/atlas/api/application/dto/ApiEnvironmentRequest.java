package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ApiEnvironmentRequest(
        @NotNull UUID environmentId,
        @Size(max = 2048) String serviceUrl
) {}
