package pl.com.ww.mesh.atlas.integration.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineUpdateRequest;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;

@Mapper(componentModel = "spring", uses = {IntegrationDatasourceMapper.class})
public interface IntegrationPipelineMapper {

    @Mapping(target = "hasDsl", expression = "java(entity.getCamelXmlDsl() != null && !entity.getCamelXmlDsl().isBlank())")
    IntegrationPipelineDto map(IntegrationPipelineEntity entity);

    @Mapping(target = "datasourceId", source = "datasource.id")
    @Mapping(target = "datasourceName", source = "datasource.name")
    @Mapping(target = "hasDsl", expression = "java(entity.getCamelXmlDsl() != null && !entity.getCamelXmlDsl().isBlank())")
    IntegrationPipelineSummaryDto mapSummary(IntegrationPipelineEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "datasource", ignore = true)
    @Mapping(target = "camelXmlDsl", ignore = true)
    @Mapping(target = "nextExecutionAt", ignore = true)
    IntegrationPipelineEntity map(IntegrationPipelineCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "targetEntity", ignore = true)
    @Mapping(target = "datasource", ignore = true)
    @Mapping(target = "camelXmlDsl", ignore = true)
    @Mapping(target = "nextExecutionAt", ignore = true)
    void updateEntity(IntegrationPipelineUpdateRequest request, @MappingTarget IntegrationPipelineEntity entity);
}
