package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;

import java.util.List;
import java.util.UUID;

public interface SyncRegistryRepository extends JpaRepository<SyncRegistryEntity, UUID> {

    boolean existsByPipelineIdAndStatusIn(UUID pipelineId, List<SyncStatus> statuses);

    Page<SyncRegistryEntity> findAllByPipelineId(UUID pipelineId, Pageable pageable);
}
