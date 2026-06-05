package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DeprecationImpactResultDto(
        List<DeprecatedApiReportItemDto> deprecatedApis,
        int totalDeprecatedApis,
        long totalAffectedSystems,
        DeprecationRisk overallRisk,
        Map<DeprecationRisk, Long> riskDistribution,
        LocalDateTime analysedAt
) {}
