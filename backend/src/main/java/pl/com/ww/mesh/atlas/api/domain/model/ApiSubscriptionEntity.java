package pl.com.ww.mesh.atlas.api.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "api_subscription", schema = "atlas")
public class ApiSubscriptionEntity extends AuditableEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "api_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_subscription_api")
    )
    private ApiEntity api;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscriber_type", nullable = false, length = 20)
    private SubscriberType subscriberType;

    /** Keycloak user UUID — populated for INTERNAL subscribers only. */
    @Column(name = "subscriber_user_id", length = 255)
    private String subscriberUserId;

    @Column(name = "subscriber_email", nullable = false, length = 255)
    private String subscriberEmail;

    @Column(name = "subscriber_name", length = 255)
    private String subscriberName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SubscriptionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 30)
    private SubscriptionSource source;

    @Builder.Default
    @Column(name = "notifications_enabled", nullable = false)
    private boolean notificationsEnabled = true;

    /** When the subscription was created — used for analytics. */
    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private LocalDateTime subscribedAt;

    /** When an external subscriber confirmed their email. */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /** UUID token for external subscription email confirmation / unsubscribe link. */
    @Column(name = "confirmation_token", length = 255)
    private String confirmationToken;
}
