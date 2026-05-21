package pl.com.ww.mesh.atlas.dictionary.application.dto;

import java.util.UUID;

public record DictionaryEntryRefDto(
        UUID id,
        String code,
        String name
) {}
