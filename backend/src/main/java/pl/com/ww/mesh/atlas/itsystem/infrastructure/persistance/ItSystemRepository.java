package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItSystemRepository extends JpaRepository<ItSystemEntity, UUID> {

    Optional<ItSystemEntity> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    Page<ItSystemEntity> findAllByActive(boolean active, Pageable pageable);
}
