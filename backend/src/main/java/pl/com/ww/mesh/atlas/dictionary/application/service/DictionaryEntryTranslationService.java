package pl.com.ww.mesh.atlas.dictionary.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryEntryTranslationMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryTranslationEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryTranslationRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DictionaryEntryTranslationService {

    private final DictionaryEntryTranslationRepository translationRepository;
    private final DictionaryEntryRepository entryRepository;
    private final DictionaryEntryTranslationMapper mapper;

    @Transactional(readOnly = true)
    public List<DictionaryEntryTranslationDto> findByEntryId(UUID entryId) {
        if (!entryRepository.existsById(entryId)) {
            throw new AtlasDictionaryEntryNotFoundException(entryId.toString());
        }
        return translationRepository.findByEntryId(entryId).stream()
                .map(mapper::map)
                .toList();
    }

    @Transactional
    public DictionaryEntryTranslationDto save(UUID entryId, String langCode, DictionaryEntryTranslationRequest request) {
        DictionaryEntryEntity entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(entryId.toString()));

        DictionaryEntryTranslationEntity entity = translationRepository
                .findByEntryIdAndLangCode(entryId, langCode)
                .orElseGet(() -> DictionaryEntryTranslationEntity.builder()
                        .entry(entry)
                        .langCode(langCode)
                        .build());

        mapper.updateEntity(request, entity);
        return mapper.map(translationRepository.save(entity));
    }

    @Transactional
    public void delete(UUID entryId, String langCode) {
        if (!entryRepository.existsById(entryId)) {
            throw new AtlasDictionaryEntryNotFoundException(entryId.toString());
        }
        translationRepository.deleteByEntryIdAndLangCode(entryId, langCode);
    }
}
