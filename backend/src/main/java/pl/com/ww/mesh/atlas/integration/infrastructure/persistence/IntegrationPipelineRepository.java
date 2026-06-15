package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;

import java.util.UUID;

public interface IntegrationPipelineRepository extends JpaRepository<IntegrationPipelineEntity, UUID> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    Page<IntegrationPipelineEntity> findAllByActiveAndStatusAndTargetEntity(
            boolean active, PipelineStatus status, TargetEntityType targetEntity, Pageable pageable);

    Page<IntegrationPipelineEntity> findAllByActive(boolean active, Pageable pageable);
}
