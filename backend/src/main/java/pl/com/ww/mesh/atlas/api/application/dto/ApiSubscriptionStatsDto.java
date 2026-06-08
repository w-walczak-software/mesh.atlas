package pl.com.ww.mesh.atlas.api.application.dto;

public record ApiSubscriptionStatsDto(
        long myActiveSubscriptions,
        long managedApisSubscribersCount,
        long newSubscriptionsLastWeek
) {}
