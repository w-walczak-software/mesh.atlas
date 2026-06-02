package pl.com.ww.mesh.atlas.systemparameter.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterDto;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterUpdateRequest;
import pl.com.ww.mesh.atlas.systemparameter.application.service.SystemParameterRevisionService;
import pl.com.ww.mesh.atlas.systemparameter.application.service.SystemParameterService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/system-parameters")
@RequiredArgsConstructor
public class SystemParameterController {

    private final SystemParameterService service;
    private final SystemParameterRevisionService revisionService;

    @IsAtlasUser
    @GetMapping
    public Page<SystemParameterDto> findAll(Pageable pageable) {
        return service.findAll(pageable);
    }

    @IsAtlasUser
    @GetMapping("/{id}")
    public SystemParameterDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @IsAtlasUser
    @GetMapping("/by-key/{key}")
    public SystemParameterDto findByKey(@PathVariable String key) {
        return service.findByKey(key);
    }

    @IsAtlasAdmin
    @PutMapping("/{id}")
    public SystemParameterDto update(@PathVariable UUID id, @Valid @RequestBody SystemParameterUpdateRequest request) {
        return service.update(id, request);
    }

    @IsAtlasAdmin
    @GetMapping("/{id}/revisions")
    public List<RevisionEntryDto<SystemParameterDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getRevisions(id);
    }
}
