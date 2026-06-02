package pl.com.ww.mesh.atlas.email.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EmailTemplateSummaryDto(
        UUID id,
        String code,
        String title,
        String description,
        List<String> tags,
        boolean active,
        LocalDateTime updatedAt,
        String updatedBy
) {}
