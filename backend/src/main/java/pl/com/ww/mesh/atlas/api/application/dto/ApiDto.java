package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ApiDto(
        UUID id,
        String code,
        String name,
        String description,
        String apiVersion,
        DictionaryEntryRefDto type,
        DictionaryEntryRefDto status,
        ItSystemRefDto producerSystem,
        DictionaryEntryRefDto dataFlowDirection,
        List<ItSystemRefDto> consumerSystems,
        TransportLayerRefDto transportLayer,
        DictionaryEntryRefDto protocol,
        DictionaryEntryRefDto authenticationMethod,
        DictionaryEntryRefDto securityPolicy,
        DictionaryEntryRefDto integrationPattern,
        DictionaryEntryRefDto messageFormat,
        Integer slaResponseTimeMs,
        BigDecimal slaUptimePct,
        DictionaryEntryRefDto slaTier,
        String slaDescription,
        DictionaryEntryRefDto contractType,
        String contractVersion,
        String contractUrl,
        String documentationUrl,
        List<String> tags,
        List<DataDomainRefDto> dataDomains,
        List<DictionaryEntryRefDto> environments,
        String externalId,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
