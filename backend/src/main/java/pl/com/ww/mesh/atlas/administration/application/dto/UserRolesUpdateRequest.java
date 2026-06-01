package pl.com.ww.mesh.atlas.administration.application.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UserRolesUpdateRequest(
        @NotNull List<String> roleNames
) {}
