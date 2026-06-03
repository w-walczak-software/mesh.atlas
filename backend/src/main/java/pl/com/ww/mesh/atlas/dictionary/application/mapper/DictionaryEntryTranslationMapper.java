package pl.com.ww.mesh.atlas.dictionary.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryTranslationEntity;

@Mapper(componentModel = "spring")
public interface DictionaryEntryTranslationMapper {

    @Mapping(target = "entryId", source = "entry.id")
    DictionaryEntryTranslationDto map(DictionaryEntryTranslationEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "entry", ignore = true)
    @Mapping(target = "langCode", ignore = true)
    void updateEntity(DictionaryEntryTranslationRequest request, @MappingTarget DictionaryEntryTranslationEntity entity);
}
