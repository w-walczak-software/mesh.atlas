package pl.com.ww.mesh.atlas.administration.domain.port;

import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;

import java.util.List;

public interface RoleProviderPort {

    List<AdminRoleDto> findAll();
}
