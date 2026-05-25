package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record ApiOwnerHistoryDto(
        long revisionNumber,
        String revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        UUID ownerId,
        String firstName,
        String lastName,
        String email,
        String roleName,
        String validFrom,
        String validTo
) {}
