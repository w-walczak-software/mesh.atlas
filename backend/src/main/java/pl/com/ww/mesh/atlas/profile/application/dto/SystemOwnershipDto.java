package pl.com.ww.mesh.atlas.profile.application.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SystemOwnershipDto(
        UUID systemId,
        String systemCode,
        String systemName,
        String systemIcon,
        String roleCode,
        String roleName,
        boolean canVerifyApi,
        boolean canDefineApi,
        LocalDate validFrom,
        LocalDate validTo,
        boolean active
) {}
