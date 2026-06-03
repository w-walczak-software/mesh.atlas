package pl.com.ww.mesh.atlas.dictionary.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeTranslationEntity;

@Mapper(componentModel = "spring")
public interface DictionaryTypeTranslationMapper {

    @Mapping(target = "typeId", source = "dictionaryType.id")
    DictionaryTypeTranslationDto map(DictionaryTypeTranslationEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dictionaryType", ignore = true)
    @Mapping(target = "langCode", ignore = true)
    void updateEntity(DictionaryTypeTranslationRequest request, @MappingTarget DictionaryTypeTranslationEntity entity);
}
