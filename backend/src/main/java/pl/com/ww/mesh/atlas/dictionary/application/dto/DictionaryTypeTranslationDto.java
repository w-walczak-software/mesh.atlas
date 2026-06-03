package pl.com.ww.mesh.atlas.dictionary.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DictionaryTypeTranslationDto(
        UUID id,
        UUID typeId,
        String langCode,
        String name,
        String description,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
