package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SyncRegistryRepository
        extends JpaRepository<SyncRegistryEntity, UUID>,
                JpaSpecificationExecutor<SyncRegistryEntity> {

    boolean existsByPipelineIdAndStatusIn(UUID pipelineId, List<SyncStatus> statuses);

    Page<SyncRegistryEntity> findAllByPipelineId(UUID pipelineId, Pageable pageable);

    Optional<SyncRegistryEntity> findFirstByPipelineIdAndStatusOrderByExecutedAtDesc(UUID pipelineId, SyncStatus status);

    @Query("SELECT COUNT(r) > 0 FROM SyncRegistryEntity r WHERE r.pipeline.targetEntity = :entityType AND r.status IN :statuses")
    boolean existsRunningByTargetEntityType(@Param("entityType") TargetEntityType entityType,
                                            @Param("statuses") List<SyncStatus> statuses);
}
