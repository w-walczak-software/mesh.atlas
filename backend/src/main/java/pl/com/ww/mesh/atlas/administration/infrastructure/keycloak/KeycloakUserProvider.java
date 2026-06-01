package pl.com.ww.mesh.atlas.administration.infrastructure.keycloak;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminUserDto;
import pl.com.ww.mesh.atlas.administration.domain.port.UserProviderPort;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakRoleRepresentation;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakUserRepresentation;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class KeycloakUserProvider implements UserProviderPort {

    private final KeycloakAdminGateway gateway;

    @Override
    public Page<AdminUserDto> findAll(String search, Pageable pageable) {
        int first = (int) pageable.getOffset();
        int max = pageable.getPageSize();
        List<AdminUserDto> users = gateway.getUsers(search, first, max).stream()
                .map(this::toUserDto)
                .toList();
        long total = gateway.countUsers(search);
        return new PageImpl<>(users, pageable, total);
    }

    @Override
    public AdminUserDto findById(String id) {
        return toUserDto(gateway.getUser(id));
    }

    @Override
    public List<AdminRoleDto> getUserRoles(String userId) {
        return Stream.concat(
                        gateway.getUserRealmRoles(userId).stream(),
                        gateway.getUserClientRoles(userId).stream())
                .filter(r -> r.name() != null && r.name().toLowerCase().startsWith("atlas"))
                .map(this::toRoleDto)
                .toList();
    }

    @Override
    public void setUserRoles(String userId, List<String> roleNames) {
        List<KeycloakRoleRepresentation> currentRealm = gateway.getUserRealmRoles(userId);
        List<KeycloakRoleRepresentation> currentClient = gateway.getUserClientRoles(userId);

        Set<String> currentNames = Stream.concat(currentRealm.stream(), currentClient.stream())
                .map(KeycloakRoleRepresentation::name)
                .collect(Collectors.toSet());
        Set<String> newNames = new HashSet<>(roleNames);

        // Build lookup map: role name → representation (from full available list)
        Map<String, KeycloakRoleRepresentation> allRoles = gateway.getAllRoles().stream()
                .collect(Collectors.toMap(KeycloakRoleRepresentation::name, r -> r, (a, b) -> a));

        List<String> toAssignNames = roleNames.stream()
                .filter(n -> !currentNames.contains(n))
                .toList();

        List<KeycloakRoleRepresentation> toAssign = toAssignNames.stream()
                .map(allRoles::get)
                .filter(Objects::nonNull)
                .toList();

        List<KeycloakRoleRepresentation> toRevokeRealm = currentRealm.stream()
                .filter(r -> !newNames.contains(r.name()))
                .toList();
        List<KeycloakRoleRepresentation> toRevokeClient = currentClient.stream()
                .filter(r -> !newNames.contains(r.name()))
                .toList();

        List<KeycloakRoleRepresentation> toAssignRealm = toAssign.stream()
                .filter(r -> !Boolean.TRUE.equals(r.clientRole()))
                .toList();
        List<KeycloakRoleRepresentation> toAssignClient = toAssign.stream()
                .filter(r -> Boolean.TRUE.equals(r.clientRole()))
                .toList();

        gateway.assignUserRealmRoles(userId, toAssignRealm);
        gateway.assignUserClientRoles(userId, toAssignClient);
        gateway.revokeUserRealmRoles(userId, toRevokeRealm);
        gateway.revokeUserClientRoles(userId, toRevokeClient);
    }

    private AdminUserDto toUserDto(KeycloakUserRepresentation rep) {
        return new AdminUserDto(
                rep.id(),
                rep.username(),
                rep.email(),
                rep.firstName(),
                rep.lastName(),
                Boolean.TRUE.equals(rep.enabled()),
                rep.createdTimestamp() != null ? Instant.ofEpochMilli(rep.createdTimestamp()) : null
        );
    }

    private AdminRoleDto toRoleDto(KeycloakRoleRepresentation rep) {
        return new AdminRoleDto(
                rep.id(),
                rep.name(),
                rep.description(),
                Boolean.TRUE.equals(rep.composite()),
                Boolean.TRUE.equals(rep.clientRole())
        );
    }
}
