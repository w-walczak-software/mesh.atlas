package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryItemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistrySummaryDto;
import pl.com.ww.mesh.atlas.integration.application.mapper.SyncRegistryMapper;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryItemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyncRegistryService {

    private final SyncRegistryRepository syncRegistryRepository;
    private final SyncRegistryItemRepository syncRegistryItemRepository;
    private final SyncRegistryMapper mapper;

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
        return syncRegistryItemRepository.findAllBySyncRegistryId(syncRegistryId, pageable).map(mapper::mapItem);
    }
}
