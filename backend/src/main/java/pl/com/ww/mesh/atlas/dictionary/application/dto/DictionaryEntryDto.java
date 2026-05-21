package pl.com.ww.mesh.atlas.dictionary.application.dto;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record DictionaryEntryDto(
        UUID id,
        UUID typeId,
        String typeCode,
        String code,
        String name,
        String description,
        int displayOrder,
        boolean active,
        boolean systemDefined,
        Map<String, Object> metadata,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
