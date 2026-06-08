package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

public record ApiEnvironmentDto(
        DictionaryEntryRefDto environment,
        String serviceUrl
) {}
