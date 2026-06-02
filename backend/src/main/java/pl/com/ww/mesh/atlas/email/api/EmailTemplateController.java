package pl.com.ww.mesh.atlas.email.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateSummaryDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateUpdateRequest;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateRevisionService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateService;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService service;
    private final EmailTemplateRevisionService revisionService;

    @IsAtlasUser
    @GetMapping
    public Page<EmailTemplateSummaryDto> findAll(Pageable pageable) {
        return service.findAll(pageable);
    }

    @IsAtlasUser
    @GetMapping("/{id}")
    public EmailTemplateDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @IsAtlasUser
    @GetMapping("/code/{code}")
    public EmailTemplateDto findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @IsAtlasAdmin
    @PutMapping("/{id}")
    public EmailTemplateDto update(@PathVariable UUID id, @Valid @RequestBody EmailTemplateUpdateRequest request) {
        return service.update(id, request);
    }

    @IsAtlasAdmin
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @IsAtlasAdmin
    @GetMapping("/{id}/revisions")
    public List<RevisionEntryDto<EmailTemplateDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getRevisions(id);
    }
}
