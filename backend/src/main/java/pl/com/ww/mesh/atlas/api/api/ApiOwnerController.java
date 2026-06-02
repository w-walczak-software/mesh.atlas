package pl.com.ww.mesh.atlas.api.api;

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
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiOwnerService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUserOrAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis/{apiId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/owners")
@RequiredArgsConstructor
public class ApiOwnerController {

    private final ApiOwnerService service;

    @GetMapping
    @IsAtlasUser
    public List<ApiOwnerDto> findAll(@PathVariable UUID apiId) {
        return service.findAll(apiId);
    }

    @PostMapping
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ApiOwnerDto create(
            @PathVariable UUID apiId,
            @Valid @RequestBody ApiOwnerCreateRequest request) {
        return service.create(apiId, request);
    }

    @PutMapping("/{ownerId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    public ApiOwnerDto update(
            @PathVariable UUID apiId,
            @PathVariable UUID ownerId,
            @Valid @RequestBody ApiOwnerUpdateRequest request) {
        return service.update(apiId, ownerId, request);
    }

    @DeleteMapping("/{ownerId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID apiId,
            @PathVariable UUID ownerId) {
        service.delete(apiId, ownerId);
    }
}
