package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.api.domain.model.SubscriberType;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionSource;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiSubscriptionDto(
        UUID id,
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String producerSystemName,
        SubscriberType subscriberType,
        String subscriberUserId,
        String subscriberEmail,
        String subscriberName,
        SubscriptionStatus status,
        SubscriptionSource source,
        boolean notificationsEnabled,
        LocalDateTime subscribedAt,
        LocalDateTime confirmedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
