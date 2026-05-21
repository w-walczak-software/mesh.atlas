package pl.com.ww.mesh.atlas.itsystem.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;

@Mapper(componentModel = "spring")
public interface ItSystemOwnerMapper {

    ItSystemOwnerDto map(ItSystemOwnerEntity entity);

    DictionaryEntryRefDto map(DictionaryEntryEntity entry);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "itSystem", ignore = true)
    @Mapping(target = "role", ignore = true)
    ItSystemOwnerEntity map(ItSystemOwnerCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "itSystem", ignore = true)
    @Mapping(target = "role", ignore = true)
    void updateEntity(ItSystemOwnerUpdateRequest request, @MappingTarget ItSystemOwnerEntity entity);
}
