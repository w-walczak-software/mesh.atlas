package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface ApiRepository extends JpaRepository<ApiEntity, UUID>, JpaSpecificationExecutor<ApiEntity> {

    boolean existsByCode(String code);

    Optional<ApiEntity> findByCode(String code);

    long countByActive(boolean active);

    long countByCreatedAtAfter(LocalDateTime after);

    long countBySlaResponseTimeMsIsNotNull();

    long countByApiVersionIsNotNull();

    @Query("SELECT COUNT(a) FROM ApiEntity a WHERE a.documentationUrl IS NOT NULL OR a.contractUrl IS NOT NULL")
    long countWithDocumentation();
}
