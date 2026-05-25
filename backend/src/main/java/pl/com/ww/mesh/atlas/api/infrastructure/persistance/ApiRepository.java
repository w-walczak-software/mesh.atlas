package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;

import java.util.Optional;
import java.util.UUID;

public interface ApiRepository extends JpaRepository<ApiEntity, UUID>, JpaSpecificationExecutor<ApiEntity> {

    boolean existsByCode(String code);

    Optional<ApiEntity> findByCode(String code);
}
