package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingApiEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.util.List;
import java.util.UUID;

public interface StagingApiRepository extends JpaRepository<StagingApiEntity, UUID> {

    List<StagingApiEntity> findAllByPipelineIdAndStagingStatus(UUID pipelineId, StagingStatus status);

    List<StagingApiEntity> findAllByPipelineId(UUID pipelineId);

    @Modifying
    @Query("DELETE FROM StagingApiEntity s WHERE s.pipeline.id = :pipelineId")
    void deleteAllByPipelineId(UUID pipelineId);
}
