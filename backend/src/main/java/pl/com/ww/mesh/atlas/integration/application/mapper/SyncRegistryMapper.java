package pl.com.ww.mesh.atlas.integration.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistryItemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncRegistrySummaryDto;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryItemEntity;

@Mapper(componentModel = "spring")
public interface SyncRegistryMapper {

    @Mapping(target = "pipelineId", source = "pipeline.id")
    @Mapping(target = "pipelineCode", source = "pipeline.code")
    @Mapping(target = "pipelineName", source = "pipeline.name")
    SyncRegistryDto map(SyncRegistryEntity entity);

    @Mapping(target = "pipelineId", source = "pipeline.id")
    @Mapping(target = "pipelineCode", source = "pipeline.code")
    @Mapping(target = "pipelineName", source = "pipeline.name")
    SyncRegistrySummaryDto mapSummary(SyncRegistryEntity entity);

    SyncRegistryItemDto mapItem(SyncRegistryItemEntity entity);
}
