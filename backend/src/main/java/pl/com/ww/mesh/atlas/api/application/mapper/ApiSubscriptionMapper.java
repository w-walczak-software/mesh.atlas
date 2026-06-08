package pl.com.ww.mesh.atlas.api.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSummaryDto;
import pl.com.ww.mesh.atlas.api.domain.model.ApiSubscriptionEntity;

@Mapper(componentModel = "spring")
public interface ApiSubscriptionMapper {

    @Mapping(target = "apiId",             source = "api.id")
    @Mapping(target = "apiCode",           source = "api.code")
    @Mapping(target = "apiName",           source = "api.name")
    @Mapping(target = "apiVersion",        source = "api.apiVersion")
    @Mapping(target = "producerSystemName", source = "api.producerSystem.name")
    ApiSubscriptionDto map(ApiSubscriptionEntity entity);

    @Mapping(target = "apiId",             source = "api.id")
    @Mapping(target = "apiCode",           source = "api.code")
    @Mapping(target = "apiName",           source = "api.name")
    @Mapping(target = "apiVersion",        source = "api.apiVersion")
    @Mapping(target = "producerSystemName", source = "api.producerSystem.name")
    ApiSubscriptionSummaryDto mapSummary(ApiSubscriptionEntity entity);
}
