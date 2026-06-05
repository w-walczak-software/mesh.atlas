package pl.com.ww.mesh.atlas.transportlayer.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerCreateRequest;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSummaryDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerUpdateRequest;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

@Mapper(componentModel = "spring")
public interface TransportLayerMapper {

    TransportLayerDto map(TransportLayerEntity entity);

    TransportLayerSummaryDto mapSummary(TransportLayerEntity entity);

    ItSystemRefDto mapItSystemRef(ItSystemEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "itSystem", ignore = true)
    TransportLayerEntity map(TransportLayerCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "itSystem", ignore = true)
    void updateEntity(TransportLayerUpdateRequest request, @MappingTarget TransportLayerEntity entity);

}
