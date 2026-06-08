package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApiSubscriptionSelfRequest(
        @NotNull UUID apiId
) {}
