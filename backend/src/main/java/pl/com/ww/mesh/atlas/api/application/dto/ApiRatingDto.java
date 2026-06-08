package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.api.domain.model.RaterType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiRatingDto(
        UUID id,
        int score,
        String raterId,
        RaterType raterType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
