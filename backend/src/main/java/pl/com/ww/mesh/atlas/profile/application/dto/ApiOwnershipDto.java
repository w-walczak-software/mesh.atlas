package pl.com.ww.mesh.atlas.profile.application.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ApiOwnershipDto(
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String producerSystemName,
        String roleCode,
        String roleName,
        boolean canEditApi,
        LocalDate validFrom,
        LocalDate validTo,
        boolean active
) {}
