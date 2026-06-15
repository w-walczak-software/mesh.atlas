package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationDatasourceEntity;

import java.util.UUID;

public interface IntegrationDatasourceRepository extends JpaRepository<IntegrationDatasourceEntity, UUID> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);
}
