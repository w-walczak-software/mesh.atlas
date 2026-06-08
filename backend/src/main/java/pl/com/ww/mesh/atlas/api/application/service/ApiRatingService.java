package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingSummaryDto;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiRatingEntity;
import pl.com.ww.mesh.atlas.api.domain.model.RaterType;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRatingRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ApiRatingService {

    /**
     * Bayesian confidence threshold (m).
     * Controls how strongly new APIs with few votes are pulled toward the global mean.
     * At m=5 an API needs ~5 real votes before its own scores dominate the weighted score.
     */
    private static final int CONFIDENCE_THRESHOLD = 5;

    private final ApiRatingRepository ratingRepository;
    private final ApiRepository apiRepository;
    private final UserContextService userContextService;

    public ApiRatingDto rate(UUID apiId, ApiRatingRequest request) {
        var api = apiRepository.findById(apiId)
                .orElseThrow(() -> new AtlasApiNotFoundException(apiId.toString()));

        var user = userContextService.getCurrentUser();

        var entity = ratingRepository
                .findByApiIdAndRaterIdAndRaterType(apiId, user.email(), RaterType.INTERNAL_USER)
                .orElseGet(() -> {
                    var r = new ApiRatingEntity();
                    r.setApi(api);
                    r.setRaterId(user.email());
                    r.setRaterType(RaterType.INTERNAL_USER);
                    return r;
                });

        entity.setScore(request.score());
        return toDto(ratingRepository.saveAndFlush(entity));
    }

    @Transactional(readOnly = true)
    public Optional<ApiRatingDto> getMyRating(UUID apiId) {
        var user = userContextService.getCurrentUser();
        return ratingRepository
                .findByApiIdAndRaterIdAndRaterType(apiId, user.email(), RaterType.INTERNAL_USER)
                .map(this::toDto);
    }

    /**
     * Returns the full rating summary for a single API.
     *
     * The displayed score is a Bayesian average rather than a plain mean.
     * Motivation: a brand-new API with a single 5-star vote should not outrank
     * a well-established API with 200 votes averaging 4.5 stars.
     *
     * Formula (IMDB-style):
     *   W = (v * R + m * C) / (v + m)
     *   v – number of votes for this API
     *   R – arithmetic mean of scores for this API
     *   m – confidence threshold (CONFIDENCE_THRESHOLD = 5)
     *   C – global arithmetic mean across all ratings in the system
     *
     * When v >> m the weighted score converges to R (the API's true average).
     * When v << m the weighted score is pulled toward C (the global mean),
     * penalising statistical flukes on sparsely-rated APIs.
     */
    @Transactional(readOnly = true)
    public ApiRatingSummaryDto getSummary(UUID apiId) {
        long count = ratingRepository.countByApiId(apiId);
        if (count == 0) {
            return new ApiRatingSummaryDto(0, 0.0, 0.0, Map.of());
        }
        double avg = ratingRepository.findAverageScoreByApiId(apiId).orElse(0.0);
        double globalAvg = ratingRepository.findGlobalAverageScore().orElse(3.0);
        double weighted = bayesianAverage(count, avg, CONFIDENCE_THRESHOLD, globalAvg);

        Map<Integer, Long> dist = new TreeMap<>();
        ratingRepository.findScoreDistributionByApiId(apiId)
                .forEach(row -> dist.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue()));

        return new ApiRatingSummaryDto(count, round2(avg), round2(weighted), dist);
    }

    /**
     * Batch summary fetch for a page of APIs (avoids N+1 in the list endpoint).
     * Returns a map of apiId → ApiRatingSummaryDto.
     * APIs with no ratings are absent from the map.
     */
    @Transactional(readOnly = true)
    public Map<UUID, ApiRatingSummaryDto> getSummaryMap(Collection<UUID> apiIds) {
        if (apiIds.isEmpty()) {
            return Map.of();
        }
        double globalAvg = ratingRepository.findGlobalAverageScore().orElse(3.0);
        Map<UUID, ApiRatingSummaryDto> result = new HashMap<>();
        ratingRepository.findAggregatesByApiIds(apiIds).forEach(row -> {
            UUID id = (UUID) row[0];
            double avg = ((Number) row[1]).doubleValue();
            long count = ((Number) row[2]).longValue();
            double weighted = bayesianAverage(count, avg, CONFIDENCE_THRESHOLD, globalAvg);
            result.put(id, new ApiRatingSummaryDto(count, round2(avg), round2(weighted), Map.of()));
        });
        return result;
    }

    public void deleteMyRating(UUID apiId) {
        var user = userContextService.getCurrentUser();
        ratingRepository.deleteByApiIdAndRaterIdAndRaterType(apiId, user.email(), RaterType.INTERNAL_USER);
    }

    private double bayesianAverage(long v, double R, int m, double C) {
        return (v * R + m * C) / (v + m);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private ApiRatingDto toDto(ApiRatingEntity entity) {
        return new ApiRatingDto(
                entity.getId(),
                entity.getScore(),
                entity.getRaterId(),
                entity.getRaterType(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
