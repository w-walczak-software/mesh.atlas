package pl.com.ww.mesh.atlas.profile.application.dto;

import java.util.List;

public record UserProfileDto(
        String email,
        String fullName,
        String username,
        List<String> platformRoles,
        List<SystemOwnershipDto> systemOwnerships,
        List<ApiOwnershipDto> apiOwnerships,
        GovernanceCapabilitiesDto governanceCapabilities
) {}
