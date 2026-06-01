package pl.com.ww.mesh.atlas.administration.application.dto;

import java.time.Instant;

public record AdminUserDto(
        String id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        Instant createdAt
) {}
