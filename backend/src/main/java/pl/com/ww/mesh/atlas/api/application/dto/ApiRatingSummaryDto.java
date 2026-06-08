package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.Map;

public record ApiRatingSummaryDto(
        long ratingCount,
        double averageRating,
        double weightedScore,
        Map<Integer, Long> distribution
) {}
