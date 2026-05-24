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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryRevisionService;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryTypeService;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dictionary-types")
@RequiredArgsConstructor
public class DictionaryTypeController {

    private final DictionaryTypeService service;
    private final DictionaryRevisionService revisionService;

    @GetMapping
    @IsAtlasUser
    public Page<DictionaryTypeDto> findAll(
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "code") Pageable pageable) {
        return service.findAll(active, pageable);
    }

    @GetMapping("/{id}")
    @IsAtlasUser
    public DictionaryTypeDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @GetMapping("/code/{code}")
    @IsAtlasUser
    public DictionaryTypeDto findByCode(@PathVariable String code) {
        return service.findByCode(code);
    }

    @PostMapping
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public DictionaryTypeDto create(@Valid @RequestBody DictionaryTypeCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @IsAtlasAdmin
    public DictionaryTypeDto update(@PathVariable UUID id,
                                    @Valid @RequestBody DictionaryTypeUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @GetMapping("/{id}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<DictionaryTypeDto>> getRevisions(@PathVariable UUID id) {
        return revisionService.getTypeRevisions(id);
    }
}
