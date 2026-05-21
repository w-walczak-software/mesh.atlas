package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeUpdateRequest;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataNotFoundException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDuplicateCodeException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasModificationException;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryTypeMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DictionaryTypeService {

    private final DictionaryTypeRepository repository;
    private final DictionaryTypeMapper mapper;

    @Transactional(readOnly = true)
    public Page<DictionaryTypeDto> findAll(Boolean active, Pageable pageable) {
        Page<DictionaryTypeEntity> page = (active != null)
                ? repository.findAllByActive(active, pageable)
                : repository.findAll(pageable);
        return page.map(mapper::map);
    }

    @Transactional(readOnly = true)
    public DictionaryTypeDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasDataNotFoundException("dic.type.not.found"));
    }

    @Transactional(readOnly = true)
    public DictionaryTypeDto findByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasDataNotFoundException("dic.type.not.found"));
    }

    @Transactional
    public DictionaryTypeDto create(DictionaryTypeCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new AtlasDuplicateCodeException("dic.type.found");
        }
        DictionaryTypeEntity entity = mapper.map(request);
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public DictionaryTypeDto update(UUID id, DictionaryTypeUpdateRequest request) {
        DictionaryTypeEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDataNotFoundException("dic.type.not.found"));
        mapper.updateEntity(request, entity);
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        DictionaryTypeEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDataNotFoundException("dic.type.not.found"));
        if (entity.isSystemDefined()) {
            throw new AtlasModificationException("dic.type.system.def.mod");
        }
        entity.setActive(false);
        repository.save(entity);
    }
}
