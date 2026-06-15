package pl.com.ww.mesh.atlas.integration.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineDictionaryMappingEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PipelineDictionaryMappingRepository extends JpaRepository<PipelineDictionaryMappingEntity, UUID> {

    List<PipelineDictionaryMappingEntity> findAllByPipelineId(UUID pipelineId);

    List<PipelineDictionaryMappingEntity> findAllByPipelineIdAndExternalValueIsNotNull(UUID pipelineId);

    void deleteAllByPipelineId(UUID pipelineId);

    boolean existsByPipelineIdAndAtlasEntryId(UUID pipelineId, UUID atlasEntryId);

    boolean existsByPipelineIdAndDictionaryTypeCodeAndExternalValue(
            UUID pipelineId, String dictionaryTypeCode, String externalValue);
}
