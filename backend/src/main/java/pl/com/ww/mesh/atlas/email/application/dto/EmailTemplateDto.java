package pl.com.ww.mesh.atlas.email.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EmailTemplateDto(
        UUID id,
        String code,
        String title,
        String body,
        String description,
        List<String> tags,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy,
        Long version
) {}
