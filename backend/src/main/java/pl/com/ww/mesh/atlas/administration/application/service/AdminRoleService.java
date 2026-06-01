package pl.com.ww.mesh.atlas.administration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.domain.port.RoleProviderPort;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleProviderPort roleProvider;

    public List<AdminRoleDto> findAll() {
        return roleProvider.findAll();
    }
}
