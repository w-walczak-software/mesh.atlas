package pl.com.ww.mesh.atlas.dictionary.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeUpdateRequest;

@Mapper(componentModel = "spring")
public interface DictionaryTypeMapper {

    DictionaryTypeDto map(DictionaryTypeEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    DictionaryTypeEntity map(DictionaryTypeCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "systemDefined", ignore = true)
    void updateEntity(DictionaryTypeUpdateRequest request, @MappingTarget DictionaryTypeEntity entity);
}
