package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryTypeTranslationMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeTranslationEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeTranslationRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DictionaryTypeTranslationService {

    private final DictionaryTypeTranslationRepository translationRepository;
    private final DictionaryTypeRepository typeRepository;
    private final DictionaryTypeTranslationMapper mapper;

    @Transactional(readOnly = true)
    public List<DictionaryTypeTranslationDto> findByTypeId(UUID typeId) {
        if (!typeRepository.existsById(typeId)) {
            throw new AtlasDictionaryNotFoundException(typeId.toString());
        }
        return translationRepository.findByDictionaryTypeId(typeId).stream()
                .map(mapper::map)
                .toList();
    }

    @Transactional
    public DictionaryTypeTranslationDto save(UUID typeId, String langCode, DictionaryTypeTranslationRequest request) {
        DictionaryTypeEntity type = typeRepository.findById(typeId)
                .orElseThrow(() -> new AtlasDictionaryNotFoundException(typeId.toString()));

        DictionaryTypeTranslationEntity entity = translationRepository
                .findByDictionaryTypeIdAndLangCode(typeId, langCode)
                .orElseGet(() -> DictionaryTypeTranslationEntity.builder()
                        .dictionaryType(type)
                        .langCode(langCode)
                        .build());

        mapper.updateEntity(request, entity);
        return mapper.map(translationRepository.save(entity));
    }

    @Transactional
    public void delete(UUID typeId, String langCode) {
        if (!typeRepository.existsById(typeId)) {
            throw new AtlasDictionaryNotFoundException(typeId.toString());
        }
        translationRepository.deleteByDictionaryTypeIdAndLangCode(typeId, langCode);
    }
}
