package pl.com.ww.mesh.atlas.integration.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineUpdateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncTriggerDto;
import pl.com.ww.mesh.atlas.integration.application.service.IntegrationPipelineService;
import pl.com.ww.mesh.atlas.integration.application.service.SyncExecutionService;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/pipelines")
@RequiredArgsConstructor
public class IntegrationPipelineController {

    private final IntegrationPipelineService pipelineService;
    private final SyncExecutionService syncExecutionService;
    private final UserContextService userContextService;

    @GetMapping
    @IsAtlasAdmin
    public Page<IntegrationPipelineSummaryDto> findAll(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) PipelineStatus status,
            @RequestParam(required = false) TargetEntityType targetEntity,
            @PageableDefault(size = 20) Pageable pageable) {
        return pipelineService.findAll(active, code, name, status, targetEntity, pageable);
    }

    @GetMapping("/{id}")
    @IsAtlasAdmin
    public IntegrationPipelineDto findById(@PathVariable UUID id) {
        return pipelineService.findById(id);
    }

    @PostMapping
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public IntegrationPipelineDto create(@Valid @RequestBody IntegrationPipelineCreateRequest request) {
        return pipelineService.create(request);
    }

    @PutMapping("/{id}")
    @IsAtlasAdmin
    public IntegrationPipelineDto update(@PathVariable UUID id,
                                          @Valid @RequestBody IntegrationPipelineUpdateRequest request) {
        return pipelineService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        pipelineService.deactivate(id);
    }

    @PostMapping(value = "/{id}/dsl", consumes = MediaType.TEXT_PLAIN_VALUE)
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uploadDsl(@PathVariable UUID id, @RequestBody String dsl) {
        pipelineService.uploadDsl(id, dsl);
    }

    @GetMapping(value = "/{id}/dsl", produces = MediaType.TEXT_XML_VALUE)
    @IsAtlasAdmin
    public ResponseEntity<String> getDsl(@PathVariable UUID id) {
        String dsl = pipelineService.getDsl(id);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"pipeline-" + id + ".xml\"")
                .contentType(MediaType.TEXT_XML)
                .body(dsl);
    }

    @PostMapping("/{id}/sync")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.ACCEPTED)
    public SyncTriggerDto triggerSync(@PathVariable UUID id) {
        String username = userContextService.getCurrentUser().email();
        return syncExecutionService.triggerSync(id, username);
    }
}
