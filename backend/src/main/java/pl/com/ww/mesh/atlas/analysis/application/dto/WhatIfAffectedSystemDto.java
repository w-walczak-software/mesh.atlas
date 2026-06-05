package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.List;
import java.util.UUID;

public record WhatIfAffectedSystemDto(
        UUID id,
        String code,
        String name,
        String icon,
        String statusName,
        String businessCriticalityName,
        String lifecycleStageName,
        List<String> consumedAffectedApiNames,
        int depth,
        WhatIfRisk risk
) {}
