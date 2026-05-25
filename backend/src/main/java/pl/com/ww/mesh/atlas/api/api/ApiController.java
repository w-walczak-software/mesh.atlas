package pl.com.ww.mesh.atlas.api.api;

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
import pl.com.ww.mesh.atlas.api.application.dto.ApiCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiRevisionService;
import pl.com.ww.mesh.atlas.api.application.service.ApiService;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasSystemOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis")
@RequiredArgsConstructor
public class ApiController {

    private static final String UUID_REGEX =
            "/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}";

    private final ApiService service;
    private final ApiRevisionService revisionService;

    @GetMapping
    @IsAtlasUser
    public Page<ApiSummaryDto> findAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID statusId,
            @RequestParam(required = false) UUID typeId,
            @RequestParam(required = false) UUID transportLayerId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) UUID sourceSystemId,
            @RequestParam(required = false) UUID targetSystemId,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        var criteria = new ApiSearchCriteria(query, statusId, typeId, transportLayerId,
                active, sourceSystemId, targetSystemId, tag);
        return service.findAll(criteria, pageable);
    }

    @GetMapping(UUID_REGEX)
    @IsAtlasUser
    public ApiDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/code/{code}")
    @IsAtlasUser
    public ApiDto findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @PostMapping
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ApiDto create(@Valid @RequestBody ApiCreateRequest request) {
        return service.create(request);
    }

    @PutMapping(UUID_REGEX)
    @IsAtlasSystemOrAdmin
    public ApiDto update(
            @PathVariable UUID id,
            @Valid @RequestBody ApiUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping(UUID_REGEX)
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @GetMapping(UUID_REGEX + "/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<ApiDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getRevisions(id);
    }

    @PutMapping(UUID_REGEX + "/data-domains")
    @IsAtlasSystemOrAdmin
    public ApiDto updateDataDomains(
            @PathVariable UUID id,
            @RequestBody List<UUID> dataDomainIds) {
        return service.updateDataDomains(id, dataDomainIds);
    }
}
