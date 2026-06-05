package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BlastRadiusResultDto(
        BlastRadiusNodeDto origin,
        List<BlastRadiusImpactedSystemDto> impactedSystems,
        List<BlastRadiusImpactedApiDto> impactedApis,
        int totalSystems,
        int totalApis,
        BlastSeverity severity,
        boolean maxDepthReached,
        LocalDateTime analysedAt
) {}
