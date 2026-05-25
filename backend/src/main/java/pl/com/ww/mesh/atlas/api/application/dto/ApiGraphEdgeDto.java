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
        UUID sourceSystemId,
        UUID targetSystemId,
        List<String> tags,
        boolean active
) {}
