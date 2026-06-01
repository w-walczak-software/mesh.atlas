package pl.com.ww.mesh.atlas.administration.application.dto;

public record AdminRoleDto(
        String id,
        String name,
        String description,
        boolean composite,
        boolean clientRole
) {}
