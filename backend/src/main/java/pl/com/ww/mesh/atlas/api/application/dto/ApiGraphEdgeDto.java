package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.util.List;
import java.util.UUID;

public record ApiGraphEdgeDto(
        UUID id,
        String code,
        String name,
        String apiVersion,
        DictionaryEntryRefDto type,
        DictionaryEntryRefDto status,
        TransportLayerRefDto transportLayer,
        DictionaryEntryRefDto protocol,
        DictionaryEntryRefDto authenticationMethod,
        DictionaryEntryRefDto dataFlowDirection,
        UUID producerSystemId,
        List<UUID> consumerSystemIds,
        List<String> tags,
        /** Names of active data domains associated with this API. */
        List<String> dataDomains,
        /** Names of deployment environments in which this API is available. */
        List<String> environments,
        boolean active
) {}
