package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.util.UUID;

public record PipelineDictionaryMappingDto(
        UUID id,
        UUID pipelineId,
        String dictionaryTypeCode,
        String externalValue,
        DictionaryEntryRefDto atlasEntry
) {}
