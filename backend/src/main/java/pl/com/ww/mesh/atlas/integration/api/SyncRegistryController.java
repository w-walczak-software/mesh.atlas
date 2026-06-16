package pl.com.ww.mesh.atlas.integration.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryItemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistrySummaryDto;
import pl.com.ww.mesh.atlas.integration.application.service.SyncRegistryService;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/sync-registry")
@RequiredArgsConstructor
public class SyncRegistryController {

    private final SyncRegistryService service;

    @GetMapping
    @IsAtlasAdmin
    public Page<SyncRegistrySummaryDto> findAll(
            @RequestParam(required = false) UUID pipelineId,
            @RequestParam(required = false) SyncStatus status,
            @RequestParam(required = false) String pipelineCode,
            @PageableDefault(size = 20, sort = "executedAt") Pageable pageable) {
        if (pipelineId != null) {
            return service.findByPipeline(pipelineId, pageable);
        }
        return service.findAll(status, pipelineCode, pageable);
    }

    @GetMapping("/{id}")
    @IsAtlasAdmin
    public SyncRegistryDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/items")
    @IsAtlasAdmin
    public Page<SyncRegistryItemDto> findItems(@PathVariable UUID id,
                                                @PageableDefault(size = 50) Pageable pageable) {
        return service.findItems(id, pageable);
    }

    @PostMapping("/{id}/abandon")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void abandon(@PathVariable UUID id) {
        service.abandon(id);
    }
}
