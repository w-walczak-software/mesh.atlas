package pl.com.ww.mesh.atlas.administration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminRoleDto;
import pl.com.ww.mesh.atlas.administration.application.dto.AdminUserDto;
import pl.com.ww.mesh.atlas.administration.domain.port.UserProviderPort;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserProviderPort userProvider;
    private final AuditLogPublisher auditLogPublisher;

    public Page<AdminUserDto> findAll(String search, Pageable pageable) {
        return userProvider.findAll(search, pageable);
    }

    public AdminUserDto findById(String id) {
        return userProvider.findById(id);
    }

    public List<AdminRoleDto> getUserRoles(String userId) {
        return userProvider.getUserRoles(userId);
    }

    public void setUserRoles(String userId, List<String> roleNames) {
        try {
            userProvider.setUserRoles(userId, roleNames);
            auditLogPublisher.publishSuccess(
                    AuditCategory.USER_MANAGEMENT,
                    AuditAction.USER_ROLE_ASSIGNED,
                    AuditResourceType.USER,
                    userId,
                    null,
                    "User roles updated",
                    Map.of("roles", roleNames)
            );
        } catch (Exception ex) {
            auditLogPublisher.publishFailure(
                    AuditCategory.USER_MANAGEMENT,
                    AuditAction.USER_ROLE_ASSIGNED,
                    AuditResourceType.USER,
                    userId,
                    null,
                    ex.getMessage()
            );
            throw ex;
        }
    }
}
