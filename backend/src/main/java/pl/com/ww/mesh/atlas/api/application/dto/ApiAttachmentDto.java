package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiAttachmentDto(
        UUID id,
        String fileName,
        String contentType,
        long fileSize,
        String description,
        DictionaryEntryRefDto contractType,
        LocalDateTime createdAt,
        String createdBy
) {}
