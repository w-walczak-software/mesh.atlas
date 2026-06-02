package pl.com.ww.mesh.atlas.transportlayer.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUserOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerCreateRequest;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSearchCriteria;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSummaryDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerUpdateRequest;
import pl.com.ww.mesh.atlas.transportlayer.application.service.TransportLayerRevisionService;
import pl.com.ww.mesh.atlas.transportlayer.application.service.TransportLayerService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transport-layers")
@RequiredArgsConstructor
public class TransportLayerController {

    private final TransportLayerService service;
    private final TransportLayerRevisionService revisionService;

    @GetMapping
    @IsAtlasUser
    public Page<TransportLayerSummaryDto> findAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 50, sort = "name") Pageable pageable) {
        return service.findAll(new TransportLayerSearchCriteria(query, active), pageable);
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUser
    public TransportLayerDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public TransportLayerDto create(@Valid @RequestBody TransportLayerCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    public TransportLayerDto update(
            @PathVariable UUID id,
            @Valid @RequestBody TransportLayerUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<TransportLayerDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getRevisions(id);
    }
}
