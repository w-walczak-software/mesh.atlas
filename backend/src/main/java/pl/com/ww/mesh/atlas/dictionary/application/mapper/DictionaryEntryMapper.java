package pl.com.ww.mesh.atlas.dictionary.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryUpdateRequest;

@Mapper(componentModel = "spring")
public interface DictionaryEntryMapper {

    @Mapping(target = "typeId", source = "dictionaryType.id")
    @Mapping(target = "typeCode", source = "dictionaryType.code")
    DictionaryEntryDto map(DictionaryEntryEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dictionaryType", ignore = true)
    @Mapping(target = "active", constant = "true")
    DictionaryEntryEntity map(DictionaryEntryCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "dictionaryType", ignore = true)
    @Mapping(target = "systemDefined", ignore = true)
    void updateEntity(DictionaryEntryUpdateRequest request, @MappingTarget DictionaryEntryEntity entity);
}
