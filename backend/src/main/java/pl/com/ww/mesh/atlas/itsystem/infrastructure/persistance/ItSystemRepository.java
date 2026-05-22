package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItSystemRepository extends JpaRepository<ItSystemEntity, UUID>,
        JpaSpecificationExecutor<ItSystemEntity> {

    Optional<ItSystemEntity> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    long countByCreatedAtAfter(LocalDateTime after);
}
