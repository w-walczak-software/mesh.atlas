package pl.com.ww.mesh.atlas.itsystem.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ItSystemDto(
        UUID id,
        String code,
        String name,
        String description,
        String documentationUrl,
        String repositoryUrl,
        DictionaryEntryRefDto status,
        DictionaryEntryRefDto lifecycleStage,
        DictionaryEntryRefDto businessCriticality,
        DictionaryEntryRefDto dataClassification,
        DictionaryEntryRefDto systemType,
        DictionaryEntryRefDto architectureStyle,
        DictionaryEntryRefDto deploymentModel,
        DictionaryEntryRefDto runtimeEnvironment,
        DictionaryEntryRefDto scope,
        List<ItSystemOwnerDto> owners,
        List<String> tags,
        Map<String, Object> metadata,
        String icon,
        String externalId,
        String source,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
