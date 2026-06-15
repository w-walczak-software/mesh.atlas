package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryItemEntity;

import java.util.UUID;

public interface SyncRegistryItemRepository extends JpaRepository<SyncRegistryItemEntity, UUID> {

    Page<SyncRegistryItemEntity> findAllBySyncRegistryId(UUID syncRegistryId, Pageable pageable);

    long countBySyncRegistryIdAndStatus(UUID syncRegistryId, pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus status);
}
