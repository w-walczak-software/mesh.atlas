package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.util.UUID;

public record ApiGraphSystemDto(
        UUID id,
        String code,
        String name,
        String description,
        String icon,
        DictionaryEntryRefDto status,
        DictionaryEntryRefDto systemType,
        boolean active
) {}
