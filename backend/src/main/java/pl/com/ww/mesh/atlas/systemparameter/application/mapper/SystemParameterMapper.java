package pl.com.ww.mesh.atlas.systemparameter.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterDto;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterUpdateRequest;
import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterEntity;

@Mapper(componentModel = "spring")
public interface SystemParameterMapper {

    SystemParameterDto map(SystemParameterEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parameterKey", ignore = true)
    @Mapping(target = "parameterType", ignore = true)
    @Mapping(target = "systemDefined", ignore = true)
    void updateEntity(SystemParameterUpdateRequest request, @MappingTarget SystemParameterEntity entity);
}
