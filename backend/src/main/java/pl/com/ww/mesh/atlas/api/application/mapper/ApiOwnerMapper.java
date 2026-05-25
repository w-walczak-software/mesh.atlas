package pl.com.ww.mesh.atlas.api.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;

@Mapper(componentModel = "spring")
public interface ApiOwnerMapper {

    ApiOwnerDto map(ApiOwnerEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "api", ignore = true)
    @Mapping(target = "role", ignore = true)
    ApiOwnerEntity map(ApiOwnerCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "api", ignore = true)
    @Mapping(target = "role", ignore = true)
    void updateEntity(ApiOwnerUpdateRequest request, @MappingTarget ApiOwnerEntity entity);
}
