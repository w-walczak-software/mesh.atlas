package pl.com.ww.mesh.atlas.administration.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.application.service.AdminRoleService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService service;

    @GetMapping
    @IsAtlasAdmin
    public List<AdminRoleDto> findAll() {
        return service.findAll();
    }
}
