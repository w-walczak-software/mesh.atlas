package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;

import java.util.UUID;

public interface IntegrationPipelineRepository
        extends JpaRepository<IntegrationPipelineEntity, UUID>,
                JpaSpecificationExecutor<IntegrationPipelineEntity> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);
}
