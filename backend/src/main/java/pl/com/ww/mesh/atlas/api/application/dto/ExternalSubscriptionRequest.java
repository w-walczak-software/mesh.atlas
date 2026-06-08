package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ExternalSubscriptionRequest(
        @NotNull UUID apiId,
        @NotBlank @Email String email,
        String name
) {}
