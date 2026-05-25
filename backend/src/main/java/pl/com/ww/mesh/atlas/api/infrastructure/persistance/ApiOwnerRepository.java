package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;

import java.util.List;
import java.util.UUID;

public interface ApiOwnerRepository extends JpaRepository<ApiOwnerEntity, UUID> {

    List<ApiOwnerEntity> findByApiId(UUID apiId);
}
