package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryEntryMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryDuplicateCodeException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryModificationException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DictionaryEntryService {

    private final DictionaryEntryRepository entryRepository;
    private final DictionaryTypeRepository typeRepository;
    private final DictionaryEntryMapper mapper;

    @Transactional(readOnly = true)
    public List<DictionaryEntryDto> findByTypeCode(String typeCode, boolean onlyActive) {
        if (!typeRepository.existsByCode(typeCode)) {
            throw new AtlasDictionaryNotFoundException(typeCode);
        }
        List<DictionaryEntryEntity> entries = onlyActive
                ? entryRepository.findByDictionaryTypeCodeAndActiveTrueOrderByDisplayOrderAsc(typeCode)
                : entryRepository.findByDictionaryTypeCodeOrderByDisplayOrderAsc(typeCode);
        return entries.stream().map(mapper::map).toList();
    }

    @Transactional(readOnly = true)
    public Page<DictionaryEntryDto> findByTypeId(UUID typeId, Boolean active, Pageable pageable) {
        if (!typeRepository.existsById(typeId)) {
            throw new AtlasDictionaryNotFoundException(typeId.toString());
        }
        Page<DictionaryEntryEntity> page = (active != null)
                ? entryRepository.findByDictionaryTypeIdAndActive(typeId, active, pageable)
                : entryRepository.findByDictionaryTypeId(typeId, pageable);
        return page.map(mapper::map);
    }

    @Transactional(readOnly = true)
    public DictionaryEntryDto findById(UUID id) {
        return entryRepository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
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
}
