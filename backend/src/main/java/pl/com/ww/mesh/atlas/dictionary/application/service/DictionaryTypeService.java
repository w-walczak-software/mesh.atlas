package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryTypeMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryDuplicateCodeException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryModificationException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeTranslationEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeTranslationRepository;
import pl.com.ww.mesh.atlas.systemparameter.application.service.SystemParameterService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DictionaryTypeService {

    private final DictionaryTypeRepository repository;
    private final DictionaryTypeTranslationRepository translationRepository;
    private final SystemParameterService systemParameterService;
    private final DictionaryTypeMapper mapper;

    @Transactional(readOnly = true)
    public Page<DictionaryTypeDto> findAll(Boolean active, Pageable pageable) {
        Page<DictionaryTypeEntity> page = (active != null)
                ? repository.findAllByActive(active, pageable)
                : repository.findAll(pageable);
        return applyTranslations(page);
    }

    @Transactional(readOnly = true)
    public DictionaryTypeDto findById(UUID id) {
        DictionaryTypeEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(id.toString()));
        String langCode = systemParameterService.getDefaultLanguage();
        return translationRepository.findByDictionaryTypeIdAndLangCode(id, langCode)
                .map(t -> withTranslation(mapper.map(entity), t))
                .orElseGet(() -> mapper.map(entity));
    }

    @Transactional(readOnly = true)
    public DictionaryTypeDto findByCode(String code) {
        DictionaryTypeEntity entity = repository.findByCode(code)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(code));
        String langCode = systemParameterService.getDefaultLanguage();
        return translationRepository.findByDictionaryTypeIdAndLangCode(entity.getId(), langCode)
                .map(t -> withTranslation(mapper.map(entity), t))
                .orElseGet(() -> mapper.map(entity));
    }

    @Transactional
    public DictionaryTypeDto create(DictionaryTypeCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new AtlasDictionaryDuplicateCodeException(request.code());
        }
        DictionaryTypeEntity entity = mapper.map(request);
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public DictionaryTypeDto update(UUID id, DictionaryTypeUpdateRequest request) {
        DictionaryTypeEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(id.toString()));
        mapper.updateEntity(request, entity);
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        DictionaryTypeEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(id.toString()));
        if (entity.isSystemDefined()) {
            throw new AtlasDictionaryModificationException("SYSTEM defined");
        }
        entity.setActive(false);
        repository.save(entity);
    }

    private Page<DictionaryTypeDto> applyTranslations(Page<DictionaryTypeEntity> page) {
        if (page.isEmpty()) {
            return page.map(mapper::map);
        }
        String langCode = systemParameterService.getDefaultLanguage();
        List<UUID> ids = page.stream().map(DictionaryTypeEntity::getId).toList();
        Map<UUID, DictionaryTypeTranslationEntity> translationMap = translationRepository
                .findByDictionaryTypeIdInAndLangCode(ids, langCode).stream()
                .collect(Collectors.toMap(t -> t.getDictionaryType().getId(), Function.identity()));

        return page.map(e -> {
            DictionaryTypeDto dto = mapper.map(e);
            DictionaryTypeTranslationEntity t = translationMap.get(e.getId());
            return t != null ? withTranslation(dto, t) : dto;
        });
    }

    private DictionaryTypeDto withTranslation(DictionaryTypeDto dto, DictionaryTypeTranslationEntity t) {
        return new DictionaryTypeDto(
                dto.id(), dto.code(),
                t.getName(), t.getDescription(),
                dto.systemDefined(), dto.active(),
                dto.createdAt(), dto.createdBy(), dto.updatedAt(), dto.updatedBy()
        );
    }
}
