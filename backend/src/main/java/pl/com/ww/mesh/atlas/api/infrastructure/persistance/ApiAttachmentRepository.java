package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiAttachmentRepository extends JpaRepository<ApiAttachmentEntity, UUID> {

    List<ApiAttachmentEntity> findByApiId(UUID apiId);

    Optional<ApiAttachmentEntity> findByIdAndApiId(UUID id, UUID apiId);
}
