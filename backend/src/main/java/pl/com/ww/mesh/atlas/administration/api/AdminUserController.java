package pl.com.ww.mesh.atlas.administration.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminUserDto;
import pl.com.ww.mesh.atlas.administration.application.dto.UserRolesUpdateRequest;
import pl.com.ww.mesh.atlas.administration.application.service.AdminUserService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping
    @IsAtlasAdmin
    public Page<AdminUserDto> findAll(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(search, pageable);
    }

    @GetMapping("/{id}")
    @IsAtlasAdmin
    public AdminUserDto findById(@PathVariable String id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/roles")
    @IsAtlasAdmin
    public List<AdminRoleDto> getUserRoles(@PathVariable String id) {
        return service.getUserRoles(id);
    }

    @PutMapping("/{id}/roles")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setUserRoles(@PathVariable String id,
                             @Valid @RequestBody UserRolesUpdateRequest request) {
        service.setUserRoles(id, request.roleNames());
    }
}
