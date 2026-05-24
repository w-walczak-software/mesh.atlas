package pl.com.ww.mesh.atlas.itsystem.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemCreateRequest;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSummaryDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemUpdateRequest;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;

@Mapper(componentModel = "spring", uses = {ItSystemOwnerMapper.class})
public interface ItSystemMapper {

    ItSystemDto map(ItSystemEntity entity);

    @Mapping(target = "owners", expression = "java(java.util.List.of())")
    ItSystemDto mapSnapshot(ItSystemEntity entity);

    ItSystemSummaryDto mapSummary(ItSystemEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "owners", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lifecycleStage", ignore = true)
    @Mapping(target = "businessCriticality", ignore = true)
    @Mapping(target = "dataClassification", ignore = true)
    @Mapping(target = "systemType", ignore = true)
    @Mapping(target = "architectureStyle", ignore = true)
    @Mapping(target = "deploymentModel", ignore = true)
    @Mapping(target = "runtimeEnvironment", ignore = true)
    @Mapping(target = "scope", ignore = true)
    ItSystemEntity map(ItSystemCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "owners", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "lifecycleStage", ignore = true)
    @Mapping(target = "businessCriticality", ignore = true)
    @Mapping(target = "dataClassification", ignore = true)
    @Mapping(target = "systemType", ignore = true)
    @Mapping(target = "architectureStyle", ignore = true)
    @Mapping(target = "deploymentModel", ignore = true)
    @Mapping(target = "runtimeEnvironment", ignore = true)
    @Mapping(target = "scope", ignore = true)
    void updateEntity(ItSystemUpdateRequest request, @MappingTarget ItSystemEntity entity);
}
