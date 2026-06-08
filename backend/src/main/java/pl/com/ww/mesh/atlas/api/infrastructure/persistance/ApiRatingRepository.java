package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.com.ww.mesh.atlas.api.domain.model.ApiRatingEntity;
import pl.com.ww.mesh.atlas.api.domain.model.RaterType;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiRatingRepository extends JpaRepository<ApiRatingEntity, UUID> {

    Optional<ApiRatingEntity> findByApiIdAndRaterIdAndRaterType(UUID apiId, String raterId, RaterType raterType);

    void deleteByApiIdAndRaterIdAndRaterType(UUID apiId, String raterId, RaterType raterType);

    @Query("SELECT COUNT(r) FROM ApiRatingEntity r WHERE r.api.id = :apiId")
    long countByApiId(@Param("apiId") UUID apiId);

    @Query("SELECT AVG(CAST(r.score AS double)) FROM ApiRatingEntity r WHERE r.api.id = :apiId")
    Optional<Double> findAverageScoreByApiId(@Param("apiId") UUID apiId);

    @Query("SELECT AVG(CAST(r.score AS double)) FROM ApiRatingEntity r")
    Optional<Double> findGlobalAverageScore();

    @Query("SELECT r.score, COUNT(r) FROM ApiRatingEntity r WHERE r.api.id = :apiId GROUP BY r.score ORDER BY r.score")
    List<Object[]> findScoreDistributionByApiId(@Param("apiId") UUID apiId);

    /**
     * Batch fetch: returns [api_id, avg_score, count] for all given API IDs.
     * Used to enrich page results without N+1 queries.
     */
    @Query("""
            SELECT r.api.id, AVG(CAST(r.score AS double)), COUNT(r)
            FROM ApiRatingEntity r
            WHERE r.api.id IN :apiIds
            GROUP BY r.api.id
            """)
    List<Object[]> findAggregatesByApiIds(@Param("apiIds") Collection<UUID> apiIds);
}
