package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiMessagingEndpointDto(
        UUID id,
        String name,
        DictionaryEntryRefDto endpointType,
        DictionaryEntryRefDto direction,
        DictionaryEntryRefDto messageFormat,
        String description,
        int displayOrder,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
