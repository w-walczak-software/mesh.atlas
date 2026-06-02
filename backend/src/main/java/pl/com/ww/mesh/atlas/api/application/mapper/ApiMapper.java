package pl.com.ww.mesh.atlas.api.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.api.application.dto.ApiCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.DataDomainRefDto;
import pl.com.ww.mesh.atlas.api.application.dto.TransportLayerRefDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiUpdateRequest;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

@Mapper(componentModel = "spring")
public interface ApiMapper {

    @Mapping(target = "canVerify", constant = "false")
    ApiDto map(ApiEntity entity);

    ApiSummaryDto mapSummary(ApiEntity entity);

    DataDomainRefDto mapDomain(DataDomainEntity entity);

    TransportLayerRefDto mapTransport(TransportLayerEntity entity);

    ItSystemRefDto mapItSystem(ItSystemEntity entity);

    DictionaryEntryRefDto mapEntry(DictionaryEntryEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "producerSystem", ignore = true)
    @Mapping(target = "dataFlowDirection", ignore = true)
    @Mapping(target = "consumerSystems", ignore = true)
    @Mapping(target = "transportLayer", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "protocol", ignore = true)
    @Mapping(target = "authenticationMethod", ignore = true)
    @Mapping(target = "securityPolicy", ignore = true)
    @Mapping(target = "integrationPattern", ignore = true)
    @Mapping(target = "messageFormat", ignore = true)
    @Mapping(target = "slaTier", ignore = true)
    @Mapping(target = "contractType", ignore = true)
    @Mapping(target = "owners", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "dataDomains", ignore = true)
    @Mapping(target = "environments", ignore = true)
    ApiEntity map(ApiCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "producerSystem", ignore = true)
    @Mapping(target = "dataFlowDirection", ignore = true)
    @Mapping(target = "consumerSystems", ignore = true)
    @Mapping(target = "transportLayer", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "protocol", ignore = true)
    @Mapping(target = "authenticationMethod", ignore = true)
    @Mapping(target = "securityPolicy", ignore = true)
    @Mapping(target = "integrationPattern", ignore = true)
    @Mapping(target = "messageFormat", ignore = true)
    @Mapping(target = "slaTier", ignore = true)
    @Mapping(target = "contractType", ignore = true)
    @Mapping(target = "owners", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "dataDomains", ignore = true)
    @Mapping(target = "environments", ignore = true)
    void updateEntity(ApiUpdateRequest request, @MappingTarget ApiEntity entity);
}
