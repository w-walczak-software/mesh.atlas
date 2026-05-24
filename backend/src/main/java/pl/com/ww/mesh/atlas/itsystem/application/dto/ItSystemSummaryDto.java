package pl.com.ww.mesh.atlas.itsystem.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.util.UUID;

public record ItSystemSummaryDto(
        UUID id,
        String code,
        String name,
        String icon,
        DictionaryEntryRefDto status,
        DictionaryEntryRefDto lifecycleStage,
        DictionaryEntryRefDto businessCriticality,
        DictionaryEntryRefDto systemType,
        boolean active
) {}
