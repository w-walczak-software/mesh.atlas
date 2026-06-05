package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ApiRepository extends JpaRepository<ApiEntity, UUID>, JpaSpecificationExecutor<ApiEntity> {

    boolean existsByCode(String code);

    Optional<ApiEntity> findByCode(String code);

    long countByActive(boolean active);

    long countByCreatedAtAfter(LocalDateTime after);

    long countBySlaResponseTimeMsIsNotNull();

    long countByApiVersionIsNotNull();

    @Query("""
            SELECT COUNT(a) FROM ApiEntity a
            WHERE a.documentationUrl IS NOT NULL
               OR a.contractUrl IS NOT NULL
               OR EXISTS (SELECT 1 FROM ApiAttachmentEntity att WHERE att.api = a)
            """)
    long countWithDocumentation();

    long countByGovernanceStatusInAndProducerSystemIdIn(Collection<GovernanceStatus> statuses, Collection<UUID> systemIds);

    @Query("SELECT COUNT(a) FROM ApiEntity a WHERE UPPER(a.status.code) LIKE '%DEPRECATED%'")
    long countDeprecated();

    @Query("SELECT COUNT(DISTINCT a) FROM ApiEntity a WHERE a.dataDomains IS NOT EMPTY")
    long countWithDataDomain();

    List<ApiEntity> findAllByProducerSystemIdAndActive(UUID producerSystemId, boolean active);

    @Query("SELECT a FROM ApiEntity a WHERE UPPER(a.status.code) LIKE '%DEPRECATED%' AND a.active = true")
    List<ApiEntity> findAllDeprecatedAndActive();
}
