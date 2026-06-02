package pl.com.ww.mesh.atlas.profile.application.dto;

import java.util.List;
import java.util.UUID;

public record GovernanceCapabilitiesDto(
        boolean canVerifyApisForAnySystems,
        boolean canDefineApisForAnySystems,
        List<UUID> verifiableSystemIds
) {}
