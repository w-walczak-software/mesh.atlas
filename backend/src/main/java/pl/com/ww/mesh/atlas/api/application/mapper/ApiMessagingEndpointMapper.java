package pl.com.ww.mesh.atlas.api.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointUpdateRequest;
import pl.com.ww.mesh.atlas.api.domain.model.ApiMessagingEndpointEntity;

@Mapper(componentModel = "spring")
public interface ApiMessagingEndpointMapper {

    ApiMessagingEndpointDto map(ApiMessagingEndpointEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "api", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "endpointType", ignore = true)
    @Mapping(target = "direction", ignore = true)
    @Mapping(target = "messageFormat", ignore = true)
    ApiMessagingEndpointEntity map(ApiMessagingEndpointCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "api", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "endpointType", ignore = true)
    @Mapping(target = "direction", ignore = true)
    @Mapping(target = "messageFormat", ignore = true)
    void updateEntity(ApiMessagingEndpointUpdateRequest request, @MappingTarget ApiMessagingEndpointEntity entity);
}
