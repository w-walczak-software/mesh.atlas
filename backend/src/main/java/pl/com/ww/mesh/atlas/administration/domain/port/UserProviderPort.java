package pl.com.ww.mesh.atlas.administration.domain.port;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminUserDto;

import java.util.List;

public interface UserProviderPort {

    Page<AdminUserDto> findAll(String search, Pageable pageable);

    AdminUserDto findById(String id);

    List<AdminRoleDto> getUserRoles(String userId);

    void setUserRoles(String userId, List<String> roleNames);
}
