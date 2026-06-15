package pl.com.ww.mesh.atlas.datadomain.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DataDomainDto(
        UUID id,
        String code,
        String name,
        String description,
        String documentationUrl,
        DictionaryEntryRefDto group,
        List<String> tags,
        Map<String, Object> metadata,
        String source,
        boolean active,
        List<DataDomainAttachmentDto> attachments,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
