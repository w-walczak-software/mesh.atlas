package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingDataDomainEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.util.List;
import java.util.UUID;

public interface StagingDataDomainRepository extends JpaRepository<StagingDataDomainEntity, UUID> {

    List<StagingDataDomainEntity> findAllByPipelineIdAndStagingStatus(UUID pipelineId, StagingStatus status);

    List<StagingDataDomainEntity> findAllByPipelineId(UUID pipelineId);

    List<StagingDataDomainEntity> findAllByIdInAndPipelineId(List<UUID> ids, UUID pipelineId);

    @Modifying
    @Query("DELETE FROM StagingDataDomainEntity s WHERE s.pipeline.id = :pipelineId")
    void deleteAllByPipelineId(UUID pipelineId);
}
