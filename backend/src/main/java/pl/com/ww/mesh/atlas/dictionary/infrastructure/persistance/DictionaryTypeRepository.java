package pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DictionaryTypeRepository extends JpaRepository<DictionaryTypeEntity, UUID> {

    Optional<DictionaryTypeEntity> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    Page<DictionaryTypeEntity> findAll(Pageable pageable);

    Page<DictionaryTypeEntity> findAllByActive(boolean active, Pageable pageable);
}
