package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriberType;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionSource;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionStatus;

import java.util.UUID;

public record ApiSubscriptionAdminRequest(
        @NotNull UUID apiId,
        @NotNull SubscriberType subscriberType,
        String subscriberUserId,
        @NotBlank @Email String subscriberEmail,
        String subscriberName,
        @NotNull SubscriptionStatus status,
        @NotNull SubscriptionSource source,
        boolean notificationsEnabled
) {}
