package pl.com.ww.mesh.atlas.dictionary.api;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryEntryService;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryRevisionService;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DictionaryEntryController {

    private final DictionaryEntryService service;
    private final DictionaryRevisionService revisionService;

    /**
     * Returns a flat list of entries for a given dictionary type code.
     * Intended for populating dropdowns and select fields on the frontend.
     * Default: returns only active entries ordered by display_order.
     */
    @GetMapping("/api/v1/dictionary-types/{typeCode}/entries")
    @IsAtlasUser
    public List<DictionaryEntryDto> findByTypeCode(
            @PathVariable String typeCode,
            @RequestParam(defaultValue = "true") boolean active) {
        return service.findByTypeCode(typeCode, active);
    }

    /**
     * Returns a paginated list of entries for a given dictionary type — for admin management.
     */
    @GetMapping("/api/v1/dictionary-types/{typeId}/entries/page")
    @IsAtlasUser
    public Page<DictionaryEntryDto> findByTypeIdPaged(
            @PathVariable UUID typeId,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "displayOrder") Pageable pageable) {
        return service.findByTypeId(typeId, active, pageable);
    }

    @GetMapping("/api/v1/dictionary-entries/{id}")
    @IsAtlasUser
    public DictionaryEntryDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping("/api/v1/dictionary-types/{typeId}/entries")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public DictionaryEntryDto create(@PathVariable UUID typeId,
                                     @Valid @RequestBody DictionaryEntryCreateRequest request) {
        return service.create(typeId, request);
    }

    @PutMapping("/api/v1/dictionary-entries/{id}")
    @IsAtlasAdmin
    public DictionaryEntryDto update(@PathVariable UUID id,
                                     @Valid @RequestBody DictionaryEntryUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/api/v1/dictionary-entries/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @GetMapping("/api/v1/dictionary-entries/{id}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<DictionaryEntryDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getEntryRevisions(id);
    }
}
