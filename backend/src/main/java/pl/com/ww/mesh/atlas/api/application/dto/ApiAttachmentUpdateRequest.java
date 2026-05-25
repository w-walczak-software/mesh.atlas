package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record ApiAttachmentUpdateRequest(
        String description,
        UUID contractTypeId
) {}
