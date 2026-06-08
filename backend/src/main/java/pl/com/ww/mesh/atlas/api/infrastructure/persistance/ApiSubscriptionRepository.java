package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.com.ww.mesh.atlas.api.domain.model.ApiSubscriptionEntity;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiSubscriptionRepository extends JpaRepository<ApiSubscriptionEntity, UUID> {

    Page<ApiSubscriptionEntity> findBySubscriberUserIdAndStatus(
            String subscriberUserId, SubscriptionStatus status, Pageable pageable);

    Page<ApiSubscriptionEntity> findByApiIdAndStatus(
            UUID apiId, SubscriptionStatus status, Pageable pageable);

    Page<ApiSubscriptionEntity> findByApiId(UUID apiId, Pageable pageable);

    Page<ApiSubscriptionEntity> findAll(Pageable pageable);

    boolean existsByApiIdAndSubscriberUserIdAndStatus(
            UUID apiId, String subscriberUserId, SubscriptionStatus status);

    boolean existsByApiIdAndSubscriberEmailAndStatus(
            UUID apiId, String subscriberEmail, SubscriptionStatus status);

    Optional<ApiSubscriptionEntity> findByConfirmationToken(String confirmationToken);

    Optional<ApiSubscriptionEntity> findByIdAndSubscriberUserId(UUID id, String subscriberUserId);

    /** All ACTIVE subscriptions for an API — used by the notification service. */
    @Query("SELECT s FROM ApiSubscriptionEntity s WHERE s.api.id = :apiId AND s.status = 'ACTIVE' AND s.notificationsEnabled = true")
    List<ApiSubscriptionEntity> findActiveNotifiableByApiId(@Param("apiId") UUID apiId);

    long countBySubscriberUserIdAndStatus(String subscriberUserId, SubscriptionStatus status);

    /** Count ACTIVE subscriptions for all APIs belonging to systems where the user has edit rights. */
    @Query("""
            SELECT COUNT(s) FROM ApiSubscriptionEntity s
            WHERE s.api.id IN :apiIds AND s.status = 'ACTIVE'
            """)
    long countActiveByApiIds(@Param("apiIds") List<UUID> apiIds);

    /** Subscriptions created after a given timestamp — for analytics. */
    @Query("SELECT COUNT(s) FROM ApiSubscriptionEntity s WHERE s.subscribedAt >= :since AND s.status = 'ACTIVE'")
    long countActiveCreatedSince(@Param("since") java.time.LocalDateTime since);
}
