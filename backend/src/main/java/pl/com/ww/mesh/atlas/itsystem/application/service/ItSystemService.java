package pl.com.ww.mesh.atlas.itsystem.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemMapper;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemOwnerMapper;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemDuplicateCodeException;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemOwnerNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemOwnerRepository;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItSystemService {

    private final ItSystemRepository repository;
    private final ItSystemOwnerRepository ownerRepository;
    private final DictionaryEntryRepository entryRepository;
    private final ItSystemMapper mapper;
    private final ItSystemOwnerMapper ownerMapper;

    @Transactional(readOnly = true)
    public Page<ItSystemDto> findAll(Boolean active, Pageable pageable) {
        Page<ItSystemEntity> page = (active != null)
                ? repository.findAllByActive(active, pageable)
                : repository.findAll(pageable);
        return page.map(mapper::map);
    }

    @Transactional(readOnly = true)
    public ItSystemDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public ItSystemDto findByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(code));
    }

    @Transactional
    public ItSystemDto create(ItSystemCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new AtlasItSystemDuplicateCodeException(request.code());
        }
        ItSystemEntity entity = mapper.map(request);
        applyDictionaryRefs(entity, request.statusId(), request.lifecycleStageId(),
                request.businessCriticalityId(), request.dataClassificationId(),
                request.systemTypeId(), request.architectureStyleId(),
                request.deploymentModelId(), request.runtimeEnvironmentId());
        ItSystemEntity saved = repository.save(entity);

        List<ItSystemOwnerCreateRequest> owners = request.owners() != null ? request.owners() : Collections.emptyList();
        owners.forEach(ownerRequest -> createOwnerInternal(saved, ownerRequest));

        return mapper.map(saved);
    }

    @Transactional
    public ItSystemDto update(UUID id, ItSystemUpdateRequest request) {
        ItSystemEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(id.toString()));
        mapper.updateEntity(request, entity);
        applyDictionaryRefs(entity, request.statusId(), request.lifecycleStageId(),
                request.businessCriticalityId(), request.dataClassificationId(),
                request.systemTypeId(), request.architectureStyleId(),
                request.deploymentModelId(), request.runtimeEnvironmentId());
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        ItSystemEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(id.toString()));
        entity.setActive(false);
        repository.save(entity);
    }

    // ── Owner management ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ItSystemOwnerDto> findOwners(UUID systemId) {
        if (!repository.existsById(systemId)) {
            throw new AtlasItSystemNotFoundException(systemId.toString());
        }
        return ownerRepository.findByItSystemId(systemId)
                .stream().map(ownerMapper::map).toList();
    }

    @Transactional
    public ItSystemOwnerDto addOwner(UUID systemId, ItSystemOwnerCreateRequest request) {
        ItSystemEntity system = repository.findById(systemId)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(systemId.toString()));
        return ownerMapper.map(createOwnerInternal(system, request));
    }

    @Transactional
    public ItSystemOwnerDto updateOwner(UUID systemId, UUID ownerId, ItSystemOwnerUpdateRequest request) {
        if (!repository.existsById(systemId)) {
            throw new AtlasItSystemNotFoundException(systemId.toString());
        }
        ItSystemOwnerEntity owner = ownerRepository.findById(ownerId)
                .filter(o -> o.getItSystem().getId().equals(systemId))
                .orElseThrow(() -> new AtlasItSystemOwnerNotFoundException(ownerId.toString()));
        ownerMapper.updateEntity(request, owner);
        owner.setRole(resolveEntry(request.roleId()));
        return ownerMapper.map(ownerRepository.save(owner));
    }

    @Transactional
    public void removeOwner(UUID systemId, UUID ownerId) {
        if (!repository.existsById(systemId)) {
            throw new AtlasItSystemNotFoundException(systemId.toString());
        }
        ItSystemOwnerEntity owner = ownerRepository.findById(ownerId)
                .filter(o -> o.getItSystem().getId().equals(systemId))
                .orElseThrow(() -> new AtlasItSystemOwnerNotFoundException(ownerId.toString()));
        ownerRepository.delete(owner);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private ItSystemOwnerEntity createOwnerInternal(ItSystemEntity system, ItSystemOwnerCreateRequest request) {
        ItSystemOwnerEntity owner = ownerMapper.map(request);
        owner.setItSystem(system);
        owner.setRole(resolveEntry(request.roleId()));
        return ownerRepository.save(owner);
    }

    private void applyDictionaryRefs(ItSystemEntity entity,
            UUID statusId, UUID lifecycleStageId,
            UUID businessCriticalityId, UUID dataClassificationId,
            UUID systemTypeId, UUID architectureStyleId,
            UUID deploymentModelId, UUID runtimeEnvironmentId) {
        entity.setStatus(resolveEntry(statusId));
        entity.setLifecycleStage(resolveEntry(lifecycleStageId));
        entity.setBusinessCriticality(resolveEntry(businessCriticalityId));
        entity.setDataClassification(resolveEntry(dataClassificationId));
        entity.setSystemType(resolveEntry(systemTypeId));
        entity.setArchitectureStyle(resolveEntry(architectureStyleId));
        entity.setDeploymentModel(resolveEntry(deploymentModelId));
        entity.setRuntimeEnvironment(resolveEntry(runtimeEnvironmentId));
    }

    private DictionaryEntryEntity resolveEntry(UUID id) {
        if (id == null) return null;
        return entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
    }
}
