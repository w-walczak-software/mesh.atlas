package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMessagingEndpointMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiMessagingEndpointNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiMessagingEndpointEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiMessagingEndpointRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiMessagingEndpointService {

    private final ApiMessagingEndpointRepository repository;
    private final ApiService apiService;
    private final ApiMessagingEndpointMapper mapper;

    @Transactional(readOnly = true)
    public List<ApiMessagingEndpointDto> findAll(UUID apiId) {
        apiService.getApiOrThrow(apiId);
        return repository.findByApiIdAndActiveOrderByDisplayOrderAscNameAsc(apiId, true)
                .stream().map(mapper::map).toList();
    }

    @Transactional
    public ApiMessagingEndpointDto create(UUID apiId, ApiMessagingEndpointCreateRequest request) {
        ApiEntity api = apiService.getApiOrThrow(apiId);
        ApiMessagingEndpointEntity endpoint = mapper.map(request);
        endpoint.setApi(api);
        resolveAssociations(endpoint, request.endpointTypeId(), request.directionId(), request.messageFormatId());
        return mapper.map(repository.save(endpoint));
    }

    @Transactional
    public ApiMessagingEndpointDto update(UUID apiId, UUID endpointId, ApiMessagingEndpointUpdateRequest request) {
        apiService.getApiOrThrow(apiId);
        ApiMessagingEndpointEntity endpoint = findEndpointOfApi(endpointId, apiId);
        mapper.updateEntity(request, endpoint);
        resolveAssociations(endpoint, request.endpointTypeId(), request.directionId(), request.messageFormatId());
        return mapper.map(repository.save(endpoint));
    }

    @Transactional
    public void deactivate(UUID apiId, UUID endpointId) {
        apiService.getApiOrThrow(apiId);
        ApiMessagingEndpointEntity endpoint = findEndpointOfApi(endpointId, apiId);
        endpoint.setActive(false);
        repository.save(endpoint);
    }

    private void resolveAssociations(ApiMessagingEndpointEntity endpoint,
                                     UUID endpointTypeId, UUID directionId, UUID messageFormatId) {
        endpoint.setEndpointType(apiService.resolveEntry(endpointTypeId));
        endpoint.setDirection(apiService.resolveEntry(directionId));
        endpoint.setMessageFormat(apiService.resolveEntry(messageFormatId));
    }

    private ApiMessagingEndpointEntity findEndpointOfApi(UUID endpointId, UUID apiId) {
        return repository.findByIdAndApiId(endpointId, apiId)
                .orElseThrow(() -> new AtlasApiMessagingEndpointNotFoundException(endpointId.toString()));
    }
}
