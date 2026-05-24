package pl.com.ww.mesh.atlas.datadomain.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DataDomainAttachmentDto(
        UUID id,
        String fileName,
        String contentType,
        long fileSize,
        String description,
        LocalDateTime createdAt,
        String createdBy
) {}
