package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.UUID;

public record BlastRadiusImpactedApiDto(
        UUID id,
        String code,
        String name,
        String apiVersion,
        String transportLayerName,
        UUID producerSystemId,
        String producerSystemName,
        int depth
) {}
