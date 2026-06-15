package pl.com.ww.mesh.atlas.integration.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceUpdateRequest;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationDatasourceEntity;

@Mapper(componentModel = "spring")
public interface IntegrationDatasourceMapper {

    IntegrationDatasourceDto map(IntegrationDatasourceEntity entity);

    IntegrationDatasourceSummaryDto mapSummary(IntegrationDatasourceEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "encryptedPassword", ignore = true)
    IntegrationDatasourceEntity map(IntegrationDatasourceCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "encryptedPassword", ignore = true)
    void updateEntity(IntegrationDatasourceUpdateRequest request, @MappingTarget IntegrationDatasourceEntity entity);
}
