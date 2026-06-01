package pl.com.ww.mesh.atlas.audit.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.audit.application.dto.AuditLogEntryDto;
import pl.com.ww.mesh.atlas.audit.application.dto.AuditLogSearchRequest;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

@RestController
@RequestMapping("/api/v1/admin/audit-log")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService service;

    @GetMapping
    @IsAtlasAdmin
    public Page<AuditLogEntryDto> search(
            AuditLogSearchRequest filter,
            @PageableDefault(size = 25, sort = "eventTime", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return service.search(filter, pageable);
    }
}
