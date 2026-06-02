package pl.com.ww.mesh.atlas.api.application.service;

import java.time.LocalDateTime;
import java.util.UUID;

public record ApiGovernanceEvent(
        String templateCode,
        String subject,
        UUID producerSystemId,
        String producerSystemName,
        String apiCode,
        String apiName,
        String apiVersion,
        String changedBy,
        LocalDateTime changedAt
) {}
