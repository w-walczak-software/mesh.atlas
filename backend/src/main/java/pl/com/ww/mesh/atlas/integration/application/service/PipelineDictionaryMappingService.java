package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingDto;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingInitResult;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingUpdateValueRequest;
import pl.com.ww.mesh.atlas.integration.application.mapper.PipelineDictionaryMappingMapper;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineDictionaryMappingEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.PipelineDictionaryMappingRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PipelineDictionaryMappingService {

    private static final Map<TargetEntityType, List<String>> RELEVANT_DICT_TYPES = Map.of(
            TargetEntityType.IT_SYSTEM, List.of(
                    "SYSTEM_STATUS", "LIFECYCLE_STAGE", "BUSINESS_CRITICALITY",
                    "DATA_CLASSIFICATION", "SYSTEM_TYPE", "ARCHITECTURE_STYLE",
                    "DEPLOYMENT_MODEL", "RUNTIME_ENVIRONMENT"
            ),
            TargetEntityType.API, List.of(
                    "API_STYLE", "LIFECYCLE_STAGE", "PROTOCOL",
                    "AUTHENTICATION_METHOD", "INTEGRATION_PATTERN", "MESSAGE_FORMAT"
            ),
            TargetEntityType.DATA_DOMAIN, List.of(
                    "DATA_CLASSIFICATION", "LIFECYCLE_STAGE", "BUSINESS_CRITICALITY"
            )
    );

    private final PipelineDictionaryMappingRepository mappingRepository;
    private final IntegrationPipelineService pipelineService;
    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final PipelineDictionaryMappingMapper mapper;

    public List<PipelineDictionaryMappingDto> findAllByPipeline(UUID pipelineId) {
        pipelineService.load(pipelineId);
        return mappingRepository.findAllByPipelineId(pipelineId).stream()
                .map(mapper::map)
                .toList();
    }

    @Transactional
    public PipelineDictionaryMappingDto create(UUID pipelineId, PipelineDictionaryMappingRequest request) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);
        DictionaryEntryEntity entry = loadEntry(request.atlasEntryId());
        if (mappingRepository.existsByPipelineIdAndAtlasEntryId(pipelineId, entry.getId())) {
            throw new AtlasException("Mapping for this atlas entry already exists", "DUPLICATE",
                    entry.getId().toString(), HttpStatus.CONFLICT);
        }
        PipelineDictionaryMappingEntity entity = PipelineDictionaryMappingEntity.builder()
                .pipeline(pipeline)
                .dictionaryTypeCode(request.dictionaryTypeCode())
                .externalValue(request.externalValue())
                .atlasEntry(entry)
                .build();
        return mapper.map(mappingRepository.save(entity));
    }

    @Transactional
    public PipelineDictionaryMappingDto update(UUID pipelineId, UUID mappingId, PipelineDictionaryMappingRequest request) {
        pipelineService.load(pipelineId);
        PipelineDictionaryMappingEntity entity = loadMapping(pipelineId, mappingId);
        entity.setDictionaryTypeCode(request.dictionaryTypeCode());
        entity.setExternalValue(request.externalValue());
        entity.setAtlasEntry(loadEntry(request.atlasEntryId()));
        return mapper.map(mappingRepository.save(entity));
    }

    @Transactional
    public PipelineDictionaryMappingDto updateExternalValue(UUID pipelineId, UUID mappingId,
                                                             PipelineDictionaryMappingUpdateValueRequest request) {
        pipelineService.load(pipelineId);
        PipelineDictionaryMappingEntity entity = loadMapping(pipelineId, mappingId);
        String newValue = request.externalValue() != null && request.externalValue().isBlank()
                ? null : request.externalValue();
        if (newValue != null && mappingRepository.existsByPipelineIdAndDictionaryTypeCodeAndExternalValue(
                pipelineId, entity.getDictionaryTypeCode(), newValue)) {
            throw new AtlasException(
                    "External value '%s' already mapped for type '%s'".formatted(newValue, entity.getDictionaryTypeCode()),
                    "DUPLICATE", newValue, HttpStatus.CONFLICT);
        }
        entity.setExternalValue(newValue);
        return mapper.map(mappingRepository.save(entity));
    }

    @Transactional
    public PipelineDictionaryMappingInitResult initialize(UUID pipelineId) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);
        List<String> typeCodes = RELEVANT_DICT_TYPES.getOrDefault(pipeline.getTargetEntity(), List.of());

        int created = 0;
        int skipped = 0;

        for (String typeCode : typeCodes) {
            List<DictionaryEntryEntity> entries =
                    dictionaryEntryRepository.findByDictionaryTypeCodeAndActiveTrueOrderByDisplayOrderAsc(typeCode);
            for (DictionaryEntryEntity entry : entries) {
                if (mappingRepository.existsByPipelineIdAndAtlasEntryId(pipelineId, entry.getId())) {
                    skipped++;
                    continue;
                }
                PipelineDictionaryMappingEntity stub = PipelineDictionaryMappingEntity.builder()
                        .pipeline(pipeline)
                        .dictionaryTypeCode(typeCode)
                        .externalValue(null)
                        .atlasEntry(entry)
                        .build();
                mappingRepository.save(stub);
                created++;
            }
        }

        return new PipelineDictionaryMappingInitResult(created, skipped);
    }

    @Transactional
    public void delete(UUID pipelineId, UUID mappingId) {
        pipelineService.load(pipelineId);
        mappingRepository.findById(mappingId)
                .filter(m -> m.getPipeline().getId().equals(pipelineId))
                .ifPresent(mappingRepository::delete);
    }

    private PipelineDictionaryMappingEntity loadMapping(UUID pipelineId, UUID mappingId) {
        return mappingRepository.findById(mappingId)
                .filter(m -> m.getPipeline().getId().equals(pipelineId))
                .orElseThrow(() -> new AtlasException("Mapping not found", "NOT_FOUND",
                        mappingId.toString(), HttpStatus.NOT_FOUND));
    }

    private DictionaryEntryEntity loadEntry(UUID id) {
        return dictionaryEntryRepository.findById(id)
                .orElseThrow(() -> new AtlasException("Dictionary entry not found", "NOT_FOUND",
                        id.toString(), HttpStatus.NOT_FOUND));
    }
}
