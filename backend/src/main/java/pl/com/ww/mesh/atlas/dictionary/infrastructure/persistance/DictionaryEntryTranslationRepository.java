package pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryTranslationEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DictionaryEntryTranslationRepository extends JpaRepository<DictionaryEntryTranslationEntity, UUID> {

    List<DictionaryEntryTranslationEntity> findByEntryId(UUID entryId);

    List<DictionaryEntryTranslationEntity> findByEntryIdInAndLangCode(List<UUID> entryIds, String langCode);

    Optional<DictionaryEntryTranslationEntity> findByEntryIdAndLangCode(UUID entryId, String langCode);

    void deleteByEntryIdAndLangCode(UUID entryId, String langCode);
}
