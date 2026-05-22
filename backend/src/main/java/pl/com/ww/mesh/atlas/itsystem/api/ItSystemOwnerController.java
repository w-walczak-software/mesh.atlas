package pl.com.ww.mesh.atlas.itsystem.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.service.ItSystemOwnerService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasSystemOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/it-systems/{systemId}/owners")
@RequiredArgsConstructor
public class ItSystemOwnerController {

    private final ItSystemOwnerService service;

    @GetMapping
    @IsAtlasUser
    public List<ItSystemOwnerDto> findAll(@PathVariable UUID systemId) {
        return service.findAll(systemId);
    }

    @PostMapping
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ItSystemOwnerDto create(
            @PathVariable UUID systemId,
            @Valid @RequestBody ItSystemOwnerCreateRequest request) {
        return service.create(systemId, request);
    }

    @PutMapping("/{ownerId}")
    @IsAtlasSystemOrAdmin
    public ItSystemOwnerDto update(
            @PathVariable UUID systemId,
            @PathVariable UUID ownerId,
            @Valid @RequestBody ItSystemOwnerUpdateRequest request) {
        return service.update(systemId, ownerId, request);
    }

    @DeleteMapping("/{ownerId}")
    @IsAtlasSystemOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID systemId,
            @PathVariable UUID ownerId) {
        service.delete(systemId, ownerId);
    }
}
