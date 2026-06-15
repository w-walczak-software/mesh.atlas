package pl.com.ww.mesh.atlas.integration.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.integration.application.dto.PipelineDictionaryMappingDto;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineDictionaryMappingEntity;

@Mapper(componentModel = "spring")
public interface PipelineDictionaryMappingMapper {

    @Mapping(target = "pipelineId", source = "pipeline.id")
    @Mapping(target = "atlasEntry.id", source = "atlasEntry.id")
    @Mapping(target = "atlasEntry.code", source = "atlasEntry.code")
    @Mapping(target = "atlasEntry.name", source = "atlasEntry.name")
    PipelineDictionaryMappingDto map(PipelineDictionaryMappingEntity entity);
}
