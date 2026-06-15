package pl.com.ww.mesh.atlas.integration.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingDto;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingInitResult;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingUpdateValueRequest;
import pl.com.ww.mesh.atlas.integration.application.service.PipelineDictionaryMappingService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/pipelines/{pipelineId}/mappings")
@RequiredArgsConstructor
public class PipelineDictionaryMappingController {

    private final PipelineDictionaryMappingService service;

    @GetMapping
    @IsAtlasAdmin
    public List<PipelineDictionaryMappingDto> findAll(@PathVariable UUID pipelineId) {
        return service.findAllByPipeline(pipelineId);
    }

    @PostMapping
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public PipelineDictionaryMappingDto create(@PathVariable UUID pipelineId,
                                                @Valid @RequestBody PipelineDictionaryMappingRequest request) {
        return service.create(pipelineId, request);
    }

    @PostMapping("/initialize")
    @IsAtlasAdmin
    public PipelineDictionaryMappingInitResult initialize(@PathVariable UUID pipelineId) {
        return service.initialize(pipelineId);
    }

    @PutMapping("/{id}")
    @IsAtlasAdmin
    public PipelineDictionaryMappingDto update(@PathVariable UUID pipelineId,
                                                @PathVariable UUID id,
                                                @Valid @RequestBody PipelineDictionaryMappingRequest request) {
        return service.update(pipelineId, id, request);
    }

    @PatchMapping("/{id}/value")
    @IsAtlasAdmin
    public PipelineDictionaryMappingDto updateValue(@PathVariable UUID pipelineId,
                                                     @PathVariable UUID id,
                                                     @Valid @RequestBody PipelineDictionaryMappingUpdateValueRequest request) {
        return service.updateExternalValue(pipelineId, id, request);
    }

    @DeleteMapping("/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID pipelineId, @PathVariable UUID id) {
        service.delete(pipelineId, id);
    }
}
