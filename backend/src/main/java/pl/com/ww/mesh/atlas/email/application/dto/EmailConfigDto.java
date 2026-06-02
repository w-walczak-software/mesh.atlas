package pl.com.ww.mesh.atlas.email.application.dto;

import java.util.UUID;

public record EmailConfigDto(
        UUID id,
        String provider,
        String host,
        int port,
        String username,
        boolean passwordSet,
        String fromAddress,
        String fromDisplayName,
        String encryption,
        boolean enabled,
        String updatedAt,
        String updatedBy
) {}
