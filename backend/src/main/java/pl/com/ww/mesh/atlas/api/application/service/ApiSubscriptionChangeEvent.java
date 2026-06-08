package pl.com.ww.mesh.atlas.api.application.service;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiSubscriptionChangeEvent(
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String producerSystemName,
        String changeType,
        String changedBy,
        LocalDateTime changedAt
) {}
