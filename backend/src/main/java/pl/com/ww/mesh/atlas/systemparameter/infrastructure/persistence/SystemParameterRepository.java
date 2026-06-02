package pl.com.ww.mesh.atlas.systemparameter.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterEntity;

import java.util.Optional;
import java.util.UUID;

public interface SystemParameterRepository extends JpaRepository<SystemParameterEntity, UUID> {

    Optional<SystemParameterEntity> findByParameterKey(String parameterKey);
}
