package pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface DictionaryEntryRepository extends JpaRepository<DictionaryEntryEntity, UUID> {

    List<DictionaryEntryEntity> findByDictionaryTypeCodeAndActiveTrueOrderByDisplayOrderAsc(String typeCode);

    List<DictionaryEntryEntity> findByDictionaryTypeCodeOrderByDisplayOrderAsc(String typeCode);

    Page<DictionaryEntryEntity> findByDictionaryTypeId(UUID typeId, Pageable pageable);

    Page<DictionaryEntryEntity> findByDictionaryTypeIdAndActive(UUID typeId, boolean active, Pageable pageable);

    boolean existsByDictionaryTypeIdAndCode(UUID typeId, String code);

    boolean existsByDictionaryTypeIdAndCodeAndIdNot(UUID typeId, String code, UUID id);

    boolean existsByIdAndDictionaryTypeCodeAndActiveTrue(UUID id, String typeCode);
}
