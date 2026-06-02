package pl.com.ww.mesh.atlas.itsystem.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.global.GovernanceService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasGovernanceViolationException;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSearchCriteria;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemStatsDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSummaryDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemMapper;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemOwnerMapper;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemDuplicateCodeException;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemOwnerRepository;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemSpecification;

import java.time.LocalDateTime;
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
    private final GovernanceService governanceService;

    @Transactional(readOnly = true)
    public Page<ItSystemSummaryDto> findAll(ItSystemSearchCriteria criteria, Pageable pageable) {
        return repository.findAll(new ItSystemSpecification(criteria), pageable)
                .map(mapper::mapSummary);
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
        List<ItSystemOwnerCreateRequest> owners = request.owners() != null ? request.owners() : Collections.emptyList();
        if (governanceService.isGovernanceEnabledOnApiCreate() && owners.isEmpty()) {
            throw new AtlasGovernanceViolationException("At least one owner is required when governance is enabled");
        }

        if (repository.existsByCode(request.code())) {
            throw new AtlasItSystemDuplicateCodeException(request.code());
        }
        ItSystemEntity entity = mapper.map(request);
        applyDictionaryRefs(entity, request.statusId(), request.lifecycleStageId(),
                request.businessCriticalityId(), request.dataClassificationId(),
                request.systemTypeId(), request.architectureStyleId(),
                request.deploymentModelId(), request.runtimeEnvironmentId(), request.scopeId());
        ItSystemEntity saved = repository.save(entity);

        owners.forEach(ownerRequest -> {
            ItSystemOwnerEntity owner = ownerMapper.map(ownerRequest);
            owner.setItSystem(saved);
            owner.setRole(resolveEntry(ownerRequest.roleId()));
            ownerRepository.save(owner);
        });

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
                request.deploymentModelId(), request.runtimeEnvironmentId(), request.scopeId());
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        ItSystemEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(id.toString()));
        entity.setActive(false);
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public ItSystemStatsDto getStats() {
        long total = repository.count();
        long addedLastMonth = repository.countByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
        return new ItSystemStatsDto(total, addedLastMonth);
    }

    ItSystemEntity getSystemOrThrow(UUID systemId) {
        return repository.findById(systemId)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(systemId.toString()));
    }

    DictionaryEntryEntity resolveEntry(UUID id) {
        if (id == null) return null;
        return entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
    }

    private void applyDictionaryRefs(ItSystemEntity entity,
            UUID statusId, UUID lifecycleStageId,
            UUID businessCriticalityId, UUID dataClassificationId,
            UUID systemTypeId, UUID architectureStyleId,
            UUID deploymentModelId, UUID runtimeEnvironmentId, UUID scopeId) {
        entity.setStatus(resolveEntry(statusId));
        entity.setLifecycleStage(resolveEntry(lifecycleStageId));
        entity.setBusinessCriticality(resolveEntry(businessCriticalityId));
        entity.setDataClassification(resolveEntry(dataClassificationId));
        entity.setSystemType(resolveEntry(systemTypeId));
        entity.setArchitectureStyle(resolveEntry(architectureStyleId));
        entity.setDeploymentModel(resolveEntry(deploymentModelId));
        entity.setRuntimeEnvironment(resolveEntry(runtimeEnvironmentId));
        entity.setScope(resolveEntry(scopeId));
    }
}
