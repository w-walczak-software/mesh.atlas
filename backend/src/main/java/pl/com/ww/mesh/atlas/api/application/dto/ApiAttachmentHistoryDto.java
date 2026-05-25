package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record ApiAttachmentHistoryDto(
        long revisionNumber,
        String revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        String fileName,
        String description,
        UUID contractTypeId,
        String contractTypeName
) {}
