package pl.com.ww.mesh.atlas.datadomain.application.dto;

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
        List<String> tags,
        Map<String, Object> metadata,
        boolean active,
        List<DataDomainAttachmentDto> attachments,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
