package pl.com.ww.mesh.atlas.itsystem.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemOwnerMapper;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemOwnerNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemOwnerRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItSystemOwnerService {

    private final ItSystemOwnerRepository ownerRepository;
    private final ItSystemService systemService;
    private final ItSystemOwnerMapper mapper;

    @Transactional(readOnly = true)
    public List<ItSystemOwnerDto> findAll(UUID systemId) {
        systemService.getSystemOrThrow(systemId);
        return ownerRepository.findByItSystemId(systemId)
                .stream().map(mapper::map).toList();
    }

    @Transactional
    public ItSystemOwnerDto create(UUID systemId, ItSystemOwnerCreateRequest request) {
        ItSystemEntity system = systemService.getSystemOrThrow(systemId);
        ItSystemOwnerEntity owner = mapper.map(request);
        owner.setItSystem(system);
        owner.setRole(systemService.resolveEntry(request.roleId()));
        return mapper.map(ownerRepository.save(owner));
    }

    @Transactional
    public ItSystemOwnerDto update(UUID systemId, UUID ownerId, ItSystemOwnerUpdateRequest request) {
        systemService.getSystemOrThrow(systemId);
        ItSystemOwnerEntity owner = findOwnerOfSystem(ownerId, systemId);
        mapper.updateEntity(request, owner);
        owner.setRole(systemService.resolveEntry(request.roleId()));
        return mapper.map(ownerRepository.save(owner));
    }

    @Transactional
    public void delete(UUID systemId, UUID ownerId) {
        systemService.getSystemOrThrow(systemId);
        ownerRepository.delete(findOwnerOfSystem(ownerId, systemId));
    }

    private ItSystemOwnerEntity findOwnerOfSystem(UUID ownerId, UUID systemId) {
        return ownerRepository.findById(ownerId)
                .filter(o -> o.getItSystem().getId().equals(systemId))
                .orElseThrow(() -> new AtlasItSystemOwnerNotFoundException(ownerId.toString()));
    }
}
