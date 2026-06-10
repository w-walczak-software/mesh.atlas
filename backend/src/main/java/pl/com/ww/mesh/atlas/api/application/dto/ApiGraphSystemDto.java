package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ApiGraphSystemDto(
        UUID id,
        String code,
        String name,
        String description,
        String icon,
        DictionaryEntryRefDto status,
        DictionaryEntryRefDto systemType,
        DictionaryEntryRefDto lifecycleStage,
        DictionaryEntryRefDto businessCriticality,
        DictionaryEntryRefDto dataClassification,
        DictionaryEntryRefDto architectureStyle,
        boolean active,
        List<String> tags,
        List<ApiGraphSystemOwnerDto> owners,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
