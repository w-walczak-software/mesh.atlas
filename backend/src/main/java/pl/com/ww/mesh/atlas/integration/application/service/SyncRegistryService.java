package pl.com.ww.mesh.atlas.integration.application.service;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryItemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistrySummaryDto;
import pl.com.ww.mesh.atlas.integration.application.mapper.SyncRegistryMapper;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationSyncNotAbandonableException;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationSyncRegistryNotFoundException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryItemEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryItemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncRegistryService {

    private final SyncRegistryRepository syncRegistryRepository;
    private final SyncRegistryItemRepository syncRegistryItemRepository;
    private final SyncRegistryMapper mapper;
    private final ItSystemRepository itSystemRepository;
    private final ApiRepository apiRepository;
    private final DataDomainRepository dataDomainRepository;

    public Page<SyncRegistrySummaryDto> findAll(SyncStatus status, String pipelineCode, Pageable pageable) {
        return syncRegistryRepository.findAll(buildSpec(null, status, pipelineCode), pageable).map(mapper::mapSummary);
    }

    public Page<SyncRegistrySummaryDto> findByPipeline(UUID pipelineId, Pageable pageable) {
        return syncRegistryRepository.findAll(buildSpec(pipelineId, null, null), pageable).map(mapper::mapSummary);
    }

    private Specification<SyncRegistryEntity> buildSpec(UUID pipelineId, SyncStatus status, String pipelineCode) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (pipelineId != null) {
                predicates.add(cb.equal(root.get("pipeline").get("id"), pipelineId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (pipelineCode != null && !pipelineCode.isBlank()) {
                Join<SyncRegistryEntity, IntegrationPipelineEntity> pipeline = root.join("pipeline");
                predicates.add(cb.like(cb.lower(pipeline.get("code")), "%" + pipelineCode.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public SyncRegistryDto findById(UUID id) {
        return syncRegistryRepository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new IntegrationSyncRegistryNotFoundException(id));
    }

    @Transactional
    public void abandon(UUID id) {
        SyncRegistryEntity entity = syncRegistryRepository.findById(id)
                .orElseThrow(() -> new IntegrationSyncRegistryNotFoundException(id));
        if (entity.getStatus() != SyncStatus.PENDING_REVIEW) {
            throw new IntegrationSyncNotAbandonableException(id);
        }
        entity.setStatus(SyncStatus.ABANDONED);
        syncRegistryRepository.save(entity);
    }

    public Page<SyncRegistryItemDto> findItems(UUID syncRegistryId, Pageable pageable) {
        Page<SyncRegistryItemEntity> entities = syncRegistryItemRepository.findAllBySyncRegistryId(syncRegistryId, pageable);
        Map<UUID, String[]> nameMap = buildTargetNameMap(entities);
        return entities.map(entity -> {
            SyncRegistryItemDto base = mapper.mapItem(entity);
            UUID tid = entity.getTargetId();
            if (tid != null && nameMap.containsKey(tid)) {
                String[] info = nameMap.get(tid);
                return new SyncRegistryItemDto(base.id(), base.entityType(), base.externalId(), base.targetId(),
                        info[0], info[1], base.action(), base.status(), base.errorMessage(), base.createdAt());
            }
            return base;
        });
    }

    private Map<UUID, String[]> buildTargetNameMap(Page<SyncRegistryItemEntity> entities) {
        Map<UUID, String[]> nameMap = new HashMap<>();

        Set<UUID> itSystemIds = collectTargetIds(entities, TargetEntityType.IT_SYSTEM);
        if (!itSystemIds.isEmpty()) {
            itSystemRepository.findAllById(itSystemIds)
                    .forEach(e -> nameMap.put(e.getId(), new String[]{e.getCode(), e.getName()}));
        }

        Set<UUID> apiIds = collectTargetIds(entities, TargetEntityType.API);
        if (!apiIds.isEmpty()) {
            apiRepository.findAllById(apiIds)
                    .forEach(e -> nameMap.put(e.getId(), new String[]{e.getCode(), e.getName()}));
        }

        Set<UUID> dataDomainIds = collectTargetIds(entities, TargetEntityType.DATA_DOMAIN);
        if (!dataDomainIds.isEmpty()) {
            dataDomainRepository.findAllById(dataDomainIds)
                    .forEach(e -> nameMap.put(e.getId(), new String[]{e.getCode(), e.getName()}));
        }

        return nameMap;
    }

    private Set<UUID> collectTargetIds(Page<SyncRegistryItemEntity> entities, TargetEntityType type) {
        return entities.getContent().stream()
                .filter(e -> e.getEntityType() == type && e.getTargetId() != null)
                .map(SyncRegistryItemEntity::getTargetId)
                .collect(Collectors.toSet());
    }
}
