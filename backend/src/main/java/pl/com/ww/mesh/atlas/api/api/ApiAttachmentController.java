package pl.com.ww.mesh.atlas.api.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pl.com.ww.mesh.atlas.api.application.dto.ApiAttachmentDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiAttachmentUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiAttachmentService;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasSystemOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis/{apiId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/attachments")
@RequiredArgsConstructor
public class ApiAttachmentController {

    private final ApiAttachmentService service;

    @GetMapping
    @IsAtlasUser
    public List<ApiAttachmentDto> findAll(@PathVariable UUID apiId) {
        return service.findAll(apiId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ApiAttachmentDto addAttachment(
            @PathVariable UUID apiId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) UUID contractTypeId,
            @RequestParam(required = false) String attachmentVersion,
            @RequestParam(required = false) UUID attachmentStatusId) {
        return service.addAttachment(apiId, file, description, contractTypeId, attachmentVersion, attachmentStatusId);
    }

    @GetMapping("/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/download")
    @IsAtlasUser
    public ResponseEntity<byte[]> download(
            @PathVariable UUID apiId,
            @PathVariable UUID attachmentId) {
        ApiAttachmentEntity attachment = service.download(apiId, attachmentId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(attachment.getContentType()));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(attachment.getFileName()).build()
        );
        headers.setContentLength(attachment.getFileSize());
        return ResponseEntity.ok().headers(headers).body(attachment.getContent());
    }

    @PutMapping("/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasSystemOrAdmin
    public ApiAttachmentDto updateAttachment(
            @PathVariable UUID apiId,
            @PathVariable UUID attachmentId,
            @RequestBody ApiAttachmentUpdateRequest request) {
        return service.updateAttachment(apiId, attachmentId, request);
    }

    @DeleteMapping("/{attachmentId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(
            @PathVariable UUID apiId,
            @PathVariable UUID attachmentId) {
        service.deleteAttachment(apiId, attachmentId);
    }
}
