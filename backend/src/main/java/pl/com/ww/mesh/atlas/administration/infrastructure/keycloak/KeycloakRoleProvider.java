package pl.com.ww.mesh.atlas.administration.infrastructure.keycloak;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.domain.port.RoleProviderPort;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakRoleProvider implements RoleProviderPort {

    private final KeycloakAdminGateway gateway;

    @Override
    public List<AdminRoleDto> findAll() {
        return gateway.getAllRoles().stream()
                .filter(r -> r.name() != null && r.name().toLowerCase().startsWith("atlas"))
                .map(r -> new AdminRoleDto(
                        r.id(),
                        r.name(),
                        r.description(),
                        Boolean.TRUE.equals(r.composite()),
                        Boolean.TRUE.equals(r.clientRole())))
                .toList();
    }
}
