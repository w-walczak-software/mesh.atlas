package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.api.domain.model.SubscriberType;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiSubscriptionSummaryDto(
        UUID id,
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String producerSystemName,
        SubscriberType subscriberType,
        String subscriberEmail,
        String subscriberName,
        SubscriptionStatus status,
        boolean notificationsEnabled,
        LocalDateTime subscribedAt
) {}
