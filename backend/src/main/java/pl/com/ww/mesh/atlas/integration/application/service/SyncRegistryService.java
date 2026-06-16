package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryItemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistrySummaryDto;
import pl.com.ww.mesh.atlas.integration.application.mapper.SyncRegistryMapper;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryItemEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryItemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.util.HashMap;
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

    public Page<SyncRegistrySummaryDto> findAll(Pageable pageable) {
        return syncRegistryRepository.findAll(pageable).map(mapper::mapSummary);
    }

    public Page<SyncRegistrySummaryDto> findByPipeline(UUID pipelineId, Pageable pageable) {
        return syncRegistryRepository.findAllByPipelineId(pipelineId, pageable).map(mapper::mapSummary);
    }

    public SyncRegistryDto findById(UUID id) {
        return syncRegistryRepository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("SyncRegistry not found: " + id));
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
