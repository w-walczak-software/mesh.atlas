package pl.com.ww.mesh.atlas.datadomain.application.dto;

public record DataDomainAttachmentHistoryDto(
        long revisionNumber,
        String revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        String fileName,
        String description
) {}
