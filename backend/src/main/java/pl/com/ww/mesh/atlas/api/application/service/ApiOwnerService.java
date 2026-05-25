package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiOwnerMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiOwnerNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiOwnerService {

    private final ApiOwnerRepository ownerRepository;
    private final ApiService apiService;
    private final ApiOwnerMapper mapper;

    @Transactional(readOnly = true)
    public List<ApiOwnerDto> findAll(UUID apiId) {
        apiService.getApiOrThrow(apiId);
        return ownerRepository.findByApiId(apiId)
                .stream().map(mapper::map).toList();
    }

    @Transactional
    public ApiOwnerDto create(UUID apiId, ApiOwnerCreateRequest request) {
        ApiEntity api = apiService.getApiOrThrow(apiId);
        ApiOwnerEntity owner = mapper.map(request);
        owner.setApi(api);
        owner.setRole(apiService.resolveEntry(request.roleId()));
        return mapper.map(ownerRepository.save(owner));
    }

    @Transactional
    public ApiOwnerDto update(UUID apiId, UUID ownerId, ApiOwnerUpdateRequest request) {
        apiService.getApiOrThrow(apiId);
        ApiOwnerEntity owner = findOwnerOfApi(ownerId, apiId);
        mapper.updateEntity(request, owner);
        owner.setRole(apiService.resolveEntry(request.roleId()));
        return mapper.map(ownerRepository.save(owner));
    }

    @Transactional
    public void delete(UUID apiId, UUID ownerId) {
        apiService.getApiOrThrow(apiId);
        ownerRepository.delete(findOwnerOfApi(ownerId, apiId));
    }

    private ApiOwnerEntity findOwnerOfApi(UUID ownerId, UUID apiId) {
        return ownerRepository.findById(ownerId)
                .filter(o -> o.getApi().getId().equals(apiId))
                .orElseThrow(() -> new AtlasApiOwnerNotFoundException(ownerId.toString()));
    }
}
