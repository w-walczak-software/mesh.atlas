package pl.com.ww.mesh.atlas.integration.api;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceUpdateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.TestConnectionResult;
import pl.com.ww.mesh.atlas.integration.application.service.IntegrationDatasourceService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/datasources")
@RequiredArgsConstructor
public class IntegrationDatasourceController {

    private final IntegrationDatasourceService service;

    @GetMapping
    @IsAtlasAdmin
    public Page<IntegrationDatasourceSummaryDto> findAll(@PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(pageable);
    }

    @GetMapping("/{id}")
    @IsAtlasAdmin
    public IntegrationDatasourceDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public IntegrationDatasourceDto create(@Valid @RequestBody IntegrationDatasourceCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @IsAtlasAdmin
    public IntegrationDatasourceDto update(@PathVariable UUID id,
                                            @Valid @RequestBody IntegrationDatasourceUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) {
        service.deactivate(id);
    }

    @PostMapping("/{id}/test")
    @IsAtlasAdmin
    public TestConnectionResult testConnection(@PathVariable UUID id) {
        return service.testConnection(id);
    }
}
