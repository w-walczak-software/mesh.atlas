package pl.com.ww.mesh.atlas.itsystem.api;

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
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSearchCriteria;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemStatsDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSummaryDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.service.ItSystemService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUserOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/it-systems")
@RequiredArgsConstructor
public class ItSystemController {

    private final ItSystemService service;

    @GetMapping("/me/producer-systems")
    @IsAtlasUser
    public List<ItSystemSummaryDto> getProducerSystemsForCurrentUser() {
        return service.getProducerSystemsForCurrentUser();
    }

    @GetMapping("/stats")
    @IsAtlasUser
    public ItSystemStatsDto getStats() {
        return service.getStats();
    }

    @GetMapping
    @IsAtlasUser
    public Page<ItSystemSummaryDto> findAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID statusId,
            @RequestParam(required = false) UUID lifecycleStageId,
            @RequestParam(required = false) UUID businessCriticalityId,
            @RequestParam(required = false) UUID systemTypeId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String ownerQuery,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        var criteria = new ItSystemSearchCriteria(query, statusId, lifecycleStageId,
                businessCriticalityId, systemTypeId, active, ownerQuery, tag);
        return service.findAll(criteria, pageable);
    }

    @GetMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUser
    public ItSystemDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/code/{code}")
    @IsAtlasUser
    public ItSystemDto findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @PostMapping
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ItSystemDto create(@Valid @RequestBody ItSystemCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    public ItSystemDto update(
            @PathVariable UUID id,
            @Valid @RequestBody ItSystemUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }
}
