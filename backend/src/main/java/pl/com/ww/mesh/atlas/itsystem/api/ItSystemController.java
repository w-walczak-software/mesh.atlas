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
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.service.ItSystemService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/it-systems")
@RequiredArgsConstructor
public class ItSystemController {

    private final ItSystemService service;

    // ── System CRUD ───────────────────────────────────────────────────────────

    @GetMapping
    @IsAtlasUser
    public Page<ItSystemDto> findAll(
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return service.findAll(active, pageable);
    }

    @GetMapping("/{id}")
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
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ItSystemDto create(@Valid @RequestBody ItSystemCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @IsAtlasAdmin
    public ItSystemDto update(
            @PathVariable UUID id,
            @Valid @RequestBody ItSystemUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    // ── Owner management ──────────────────────────────────────────────────────

    @GetMapping("/{id}/owners")
    @IsAtlasUser
    public List<ItSystemOwnerDto> findOwners(@PathVariable UUID id) {
        return service.findOwners(id);
    }

    @PostMapping("/{id}/owners")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ItSystemOwnerDto addOwner(
            @PathVariable UUID id,
            @Valid @RequestBody ItSystemOwnerCreateRequest request) {
        return service.addOwner(id, request);
    }

    @PutMapping("/{id}/owners/{ownerId}")
    @IsAtlasAdmin
    public ItSystemOwnerDto updateOwner(
            @PathVariable UUID id,
            @PathVariable UUID ownerId,
            @Valid @RequestBody ItSystemOwnerUpdateRequest request) {
        return service.updateOwner(id, ownerId, request);
    }

    @DeleteMapping("/{id}/owners/{ownerId}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeOwner(
            @PathVariable UUID id,
            @PathVariable UUID ownerId) {
        service.removeOwner(id, ownerId);
    }
}
