package pl.com.ww.mesh.atlas.dictionary.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DictionaryEntryTranslationDto(
        UUID id,
        UUID entryId,
        String langCode,
        String name,
        String description,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
