package pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeTranslationEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DictionaryTypeTranslationRepository extends JpaRepository<DictionaryTypeTranslationEntity, UUID> {

    List<DictionaryTypeTranslationEntity> findByDictionaryTypeId(UUID typeId);

    List<DictionaryTypeTranslationEntity> findByDictionaryTypeIdInAndLangCode(List<UUID> typeIds, String langCode);

    Optional<DictionaryTypeTranslationEntity> findByDictionaryTypeIdAndLangCode(UUID typeId, String langCode);

    void deleteByDictionaryTypeIdAndLangCode(UUID typeId, String langCode);
}
