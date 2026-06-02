package pl.com.ww.mesh.atlas.datadomain.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentHistoryDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentUpdateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainCreateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSearchCriteria;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSummaryDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainUpdateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.service.DataDomainRevisionService;
import pl.com.ww.mesh.atlas.datadomain.application.service.DataDomainService;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainAttachmentEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasPrivileged;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/data-domains")
@RequiredArgsConstructor
public class DataDomainController {

    private final DataDomainService service;
    private final DataDomainRevisionService revisionService;

    @GetMapping
    @IsAtlasUser
    public Page<DataDomainSummaryDto> findAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) UUID groupId,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return service.findAll(new DataDomainSearchCriteria(query, tag, active, groupId), pageable);
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUser
    public DataDomainDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/code/{code}")
    @IsAtlasUser
    public DataDomainDto findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @PostMapping
    @IsAtlasPrivileged
    @ResponseStatus(HttpStatus.CREATED)
    public DataDomainDto create(@Valid @RequestBody DataDomainCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasPrivileged
    public DataDomainDto update(
            @PathVariable UUID id,
            @Valid @RequestBody DataDomainUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasPrivileged
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    // ── Revisions ────────────────────────────────────────────────────────────────

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<DataDomainDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getRevisions(id);
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachment-history")
    @IsAtlasUser
    public List<DataDomainAttachmentHistoryDto> getAttachmentHistory(@PathVariable UUID id) {
        return revisionService.getAttachmentHistory(id);
    }

    // ── Attachments ──────────────────────────────────────────────────────────────

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments")
    @IsAtlasUser
    public List<DataDomainAttachmentDto> findAttachments(@PathVariable UUID id) {
        return service.findAttachments(id);
    }

    @PostMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments")
    @IsAtlasPrivileged
    @ResponseStatus(HttpStatus.CREATED)
    public DataDomainAttachmentDto uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        return service.uploadAttachment(id, file, description);
    }

    @PatchMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasPrivileged
    public DataDomainAttachmentDto updateAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId,
            @RequestBody DataDomainAttachmentUpdateRequest request) {
        return service.updateAttachment(id, attachmentId, request.description());
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUser
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        DataDomainAttachmentEntity attachment = service.getAttachmentContent(id, attachmentId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(attachment.getContentType()));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(attachment.getFileName()).build()
        );
        headers.setContentLength(attachment.getFileSize());
        return ResponseEntity.ok().headers(headers).body(attachment.getContent());
    }

    @DeleteMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasPrivileged
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(
            @PathVariable UUID id,
            @PathVariable UUID attachmentId) {
        service.deleteAttachment(id, attachmentId);
    }
}
