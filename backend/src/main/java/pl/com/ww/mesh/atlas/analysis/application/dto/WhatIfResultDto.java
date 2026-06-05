package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.time.LocalDateTime;
import java.util.List;

public record WhatIfResultDto(
        WhatIfScenarioNodeDto origin,
        WhatIfScenarioType scenarioType,
        List<WhatIfDecommissionedApiDto> decommissionedApis,
        List<WhatIfAffectedSystemDto> affectedSystems,
        List<WhatIfDataDomainImpactDto> affectedDataDomains,
        int totalDecommissionedApis,
        int totalAffectedSystems,
        int totalAffectedDataDomains,
        int orphanedDataDomains,
        WhatIfRisk overallRisk,
        boolean maxDepthReached,
        List<WhatIfRecommendationDto> recommendations,
        LocalDateTime analysedAt
) {}
