package pl.com.ww.mesh.atlas.profile.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemOwnerRepository;
import pl.com.ww.mesh.atlas.profile.application.dto.ApiOwnershipDto;
import pl.com.ww.mesh.atlas.profile.application.dto.GovernanceCapabilitiesDto;
import pl.com.ww.mesh.atlas.profile.application.dto.SystemOwnershipDto;
import pl.com.ww.mesh.atlas.profile.application.dto.UserProfileDto;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserProfileService {

    private final ItSystemOwnerRepository itSystemOwnerRepository;
    private final ApiOwnerRepository apiOwnerRepository;
    private final UserContextService userContextService;

    public UserProfileDto getProfile() {
        AuthenticatedUser user = userContextService.getCurrentUser();
        String email = user.email();

        List<ItSystemOwnerEntity> systemOwnerships = itSystemOwnerRepository.findByEmailIgnoreCase(email);
        List<ApiOwnerEntity>       apiOwnerships   = apiOwnerRepository.findByEmailIgnoreCase(email);

        List<SystemOwnershipDto> systemDtos = systemOwnerships.stream()
                .map(this::toSystemDto)
                .toList();

        List<ApiOwnershipDto> apiDtos = apiOwnerships.stream()
                .map(this::toApiDto)
                .toList();

        List<UUID> verifiableSystemIds = systemDtos.stream()
                .filter(SystemOwnershipDto::canVerifyApi)
                .map(SystemOwnershipDto::systemId)
                .distinct()
                .toList();

        GovernanceCapabilitiesDto capabilities = new GovernanceCapabilitiesDto(
                systemDtos.stream().anyMatch(SystemOwnershipDto::canVerifyApi),
                systemDtos.stream().anyMatch(SystemOwnershipDto::canDefineApi),
                verifiableSystemIds
        );

        return new UserProfileDto(
                email,
                fullName(user),
                email,
                user.roles().stream().sorted().toList(),
                systemDtos,
                apiDtos,
                capabilities
        );
    }

    private SystemOwnershipDto toSystemDto(ItSystemOwnerEntity e) {
        var system = e.getItSystem();
        var role = e.getRole();
        Map<String, Object> meta = role != null ? role.getMetadata() : null;
        boolean canVerify = boolMeta(meta, "canVerifyApi");
        boolean canDefine = boolMeta(meta, "canDefineApi");
        boolean active = e.getValidTo() == null || !e.getValidTo().isBefore(LocalDate.now());
        return new SystemOwnershipDto(
                system.getId(),
                system.getCode(),
                system.getName(),
                system.getIcon(),
                roleName(role, true),
                roleName(role, false),
                canVerify,
                canDefine,
                e.getValidFrom(),
                e.getValidTo(),
                active
        );
    }

    private ApiOwnershipDto toApiDto(ApiOwnerEntity e) {
        var api = e.getApi();
        var role = e.getRole();
        Map<String, Object> meta = role != null ? role.getMetadata() : null;
        boolean canEdit = boolMeta(meta, "canEditApi");
        boolean active = e.getValidTo() == null || !e.getValidTo().isBefore(LocalDate.now());
        String producerName = api.getProducerSystem() != null ? api.getProducerSystem().getName() : null;
        return new ApiOwnershipDto(
                api.getId(),
                api.getCode(),
                api.getName(),
                api.getApiVersion(),
                producerName,
                roleName(role, true),
                roleName(role, false),
                canEdit,
                e.getValidFrom(),
                e.getValidTo(),
                active
        );
    }

    private String roleName(DictionaryEntryEntity role, boolean code) {
        if (role == null) return null;
        return code ? role.getCode() : role.getName();
    }

    private boolean boolMeta(Map<String, Object> meta, String key) {
        return meta != null && Boolean.TRUE.equals(meta.get(key));
    }

    private String fullName(AuthenticatedUser user) {
        if (user.firstName() != null && user.lastName() != null) {
            return user.firstName() + " " + user.lastName();
        }
        return user.email();
    }
}
