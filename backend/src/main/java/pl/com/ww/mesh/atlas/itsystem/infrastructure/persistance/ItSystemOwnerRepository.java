package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItSystemOwnerRepository extends JpaRepository<ItSystemOwnerEntity, UUID> {

    List<ItSystemOwnerEntity> findByItSystemId(UUID itSystemId);
}
