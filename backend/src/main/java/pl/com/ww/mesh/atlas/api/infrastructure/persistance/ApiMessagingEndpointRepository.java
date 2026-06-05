package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.api.domain.model.ApiMessagingEndpointEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiMessagingEndpointRepository extends JpaRepository<ApiMessagingEndpointEntity, UUID> {

    List<ApiMessagingEndpointEntity> findByApiIdAndActiveOrderByDisplayOrderAscNameAsc(UUID apiId, boolean active);

    Optional<ApiMessagingEndpointEntity> findByIdAndApiId(UUID id, UUID apiId);
}
