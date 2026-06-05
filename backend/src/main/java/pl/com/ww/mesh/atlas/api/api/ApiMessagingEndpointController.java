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
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiMessagingEndpointService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUserOrAdmin;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis/{apiId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/messaging-endpoints")
@RequiredArgsConstructor
public class ApiMessagingEndpointController {

    private final ApiMessagingEndpointService service;

    @GetMapping
    @IsAtlasUser
    public List<ApiMessagingEndpointDto> findAll(@PathVariable UUID apiId) {
        return service.findAll(apiId);
    }

    @PostMapping
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ApiMessagingEndpointDto create(
            @PathVariable UUID apiId,
            @Valid @RequestBody ApiMessagingEndpointCreateRequest request) {
        return service.create(apiId, request);
    }

    @PutMapping("/{endpointId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    public ApiMessagingEndpointDto update(
            @PathVariable UUID apiId,
            @PathVariable UUID endpointId,
            @Valid @RequestBody ApiMessagingEndpointUpdateRequest request) {
        return service.update(apiId, endpointId, request);
    }

    @DeleteMapping("/{endpointId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
    @IsAtlasUserOrAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(
            @PathVariable UUID apiId,
            @PathVariable UUID endpointId) {
        service.deactivate(apiId, endpointId);
    }
}
