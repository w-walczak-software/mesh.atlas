package pl.com.ww.mesh.atlas.dictionary.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DictionaryTypeDto(
        UUID id,
        String code,
        String name,
        String description,
        boolean systemDefined,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
