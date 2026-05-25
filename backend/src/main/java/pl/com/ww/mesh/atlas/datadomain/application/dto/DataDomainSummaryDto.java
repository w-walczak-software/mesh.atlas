package pl.com.ww.mesh.atlas.datadomain.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.util.List;
import java.util.UUID;

public record DataDomainSummaryDto(
        UUID id,
        String code,
        String name,
        String description,
        DictionaryEntryRefDto group,
        List<String> tags,
        boolean active
) {}
