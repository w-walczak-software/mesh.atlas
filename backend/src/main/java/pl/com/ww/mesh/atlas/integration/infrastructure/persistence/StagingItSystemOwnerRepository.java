package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingItSystemOwnerEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.util.List;
import java.util.UUID;

public interface StagingItSystemOwnerRepository extends JpaRepository<StagingItSystemOwnerEntity, UUID> {

    List<StagingItSystemOwnerEntity> findAllByPipelineId(UUID pipelineId);

    List<StagingItSystemOwnerEntity> findAllByPipelineIdAndStagingStatus(UUID pipelineId, StagingStatus status);

    List<StagingItSystemOwnerEntity> findAllByPipelineIdAndSystemExternalId(UUID pipelineId, String systemExternalId);

    @Modifying
    @Query("DELETE FROM StagingItSystemOwnerEntity s WHERE s.pipeline.id = :pipelineId")
    void deleteAllByPipelineId(UUID pipelineId);
}
