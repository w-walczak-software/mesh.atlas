package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryEntryMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryDuplicateCodeException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryModificationException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryTranslationEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryTranslationRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;
import pl.com.ww.mesh.atlas.systemparameter.application.service.SystemParameterService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DictionaryEntryService {

    private final DictionaryEntryRepository entryRepository;
    private final DictionaryTypeRepository typeRepository;
    private final DictionaryEntryTranslationRepository translationRepository;
    private final SystemParameterService systemParameterService;
    private final DictionaryEntryMapper mapper;

    @Transactional(readOnly = true)
    public List<DictionaryEntryDto> findByTypeCode(String typeCode, boolean onlyActive) {
        if (!typeRepository.existsByCode(typeCode)) {
            throw new AtlasDictionaryNotFoundException(typeCode);
        }
        List<DictionaryEntryEntity> entries = onlyActive
                ? entryRepository.findByDictionaryTypeCodeAndActiveTrueOrderByDisplayOrderAsc(typeCode)
                : entryRepository.findByDictionaryTypeCodeOrderByDisplayOrderAsc(typeCode);
        return applyTranslations(entries);
    }

    @Transactional(readOnly = true)
    public Page<DictionaryEntryDto> findByTypeId(UUID typeId, Boolean active, Pageable pageable) {
        if (!typeRepository.existsById(typeId)) {
            throw new AtlasDictionaryNotFoundException(typeId.toString());
        }
        Page<DictionaryEntryEntity> page = (active != null)
                ? entryRepository.findByDictionaryTypeIdAndActive(typeId, active, pageable)
                : entryRepository.findByDictionaryTypeId(typeId, pageable);
        return applyTranslations(page);
    }

    @Transactional(readOnly = true)
    public DictionaryEntryDto findById(UUID id) {
        DictionaryEntryEntity entry = entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
        String langCode = systemParameterService.getDefaultLanguage();
        return translationRepository.findByEntryIdAndLangCode(id, langCode)
                .map(t -> withTranslation(mapper.map(entry), t))
                .orElseGet(() -> mapper.map(entry));
    }

    @Transactional
    public DictionaryEntryDto create(UUID typeId, DictionaryEntryCreateRequest request) {
        DictionaryTypeEntity type = typeRepository.findById(typeId)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(typeId.toString()));

        if (entryRepository.existsByDictionaryTypeIdAndCode(typeId, request.code())) {
            throw new AtlasDictionaryDuplicateCodeException(request.code());
        }

        DictionaryEntryEntity entry = mapper.map(request);
        entry.setDictionaryType(type);
        return mapper.map(entryRepository.save(entry));
    }

    @Transactional
    public DictionaryEntryDto update(UUID id, DictionaryEntryUpdateRequest request) {
        DictionaryEntryEntity entry = entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
        mapper.updateEntity(request, entry);
        return mapper.map(entryRepository.save(entry));
    }

    @Transactional
    public void deactivate(UUID id) {
        DictionaryEntryEntity entry = entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
        if (entry.isSystemDefined()) {
            throw new AtlasDictionaryModificationException("SYSTEM defined");
        }
        entry.setActive(false);
        entryRepository.save(entry);
    }

    private List<DictionaryEntryDto> applyTranslations(List<DictionaryEntryEntity> entries) {
        if (entries.isEmpty()) {
            return List.of();
        }
        String langCode = systemParameterService.getDefaultLanguage();
        List<UUID> ids = entries.stream().map(DictionaryEntryEntity::getId).toList();
        Map<UUID, DictionaryEntryTranslationEntity> translationMap = translationRepository
                .findByEntryIdInAndLangCode(ids, langCode).stream()
                .collect(Collectors.toMap(t -> t.getEntry().getId(), Function.identity()));

        return entries.stream()
                .map(e -> {
                    DictionaryEntryDto dto = mapper.map(e);
                    DictionaryEntryTranslationEntity t = translationMap.get(e.getId());
                    return t != null ? withTranslation(dto, t) : dto;
                })
                .toList();
    }

    private Page<DictionaryEntryDto> applyTranslations(Page<DictionaryEntryEntity> page) {
        if (page.isEmpty()) {
            return page.map(mapper::map);
        }
        String langCode = systemParameterService.getDefaultLanguage();
        List<UUID> ids = page.stream().map(DictionaryEntryEntity::getId).toList();
        Map<UUID, DictionaryEntryTranslationEntity> translationMap = translationRepository
                .findByEntryIdInAndLangCode(ids, langCode).stream()
                .collect(Collectors.toMap(t -> t.getEntry().getId(), Function.identity()));

        return page.map(e -> {
            DictionaryEntryDto dto = mapper.map(e);
            DictionaryEntryTranslationEntity t = translationMap.get(e.getId());
            return t != null ? withTranslation(dto, t) : dto;
        });
    }

    private DictionaryEntryDto withTranslation(DictionaryEntryDto dto, DictionaryEntryTranslationEntity t) {
        return new DictionaryEntryDto(
                dto.id(), dto.typeId(), dto.typeCode(), dto.code(),
                t.getName(), t.getDescription(),
                dto.displayOrder(), dto.active(), dto.systemDefined(),
                dto.metadata(), dto.createdAt(), dto.createdBy(), dto.updatedAt(), dto.updatedBy()
        );
    }
}
