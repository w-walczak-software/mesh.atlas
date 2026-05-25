package pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.util.Optional;
import java.util.UUID;

public interface TransportLayerRepository
        extends JpaRepository<TransportLayerEntity, UUID>,
                JpaSpecificationExecutor<TransportLayerEntity> {

    boolean existsByCode(String code);

    Optional<TransportLayerEntity> findByCode(String code);
}
