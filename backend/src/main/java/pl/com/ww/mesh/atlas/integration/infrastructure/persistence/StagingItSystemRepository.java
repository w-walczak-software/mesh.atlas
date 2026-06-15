package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingItSystemEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.util.List;
import java.util.UUID;

public interface StagingItSystemRepository extends JpaRepository<StagingItSystemEntity, UUID> {

    List<StagingItSystemEntity> findAllByPipelineIdAndStagingStatus(UUID pipelineId, StagingStatus status);

    List<StagingItSystemEntity> findAllByPipelineId(UUID pipelineId);

    @Modifying
    @Query("DELETE FROM StagingItSystemEntity s WHERE s.pipeline.id = :pipelineId")
    void deleteAllByPipelineId(UUID pipelineId);
}
