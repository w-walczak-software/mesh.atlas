package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.List;
import java.util.UUID;

public record WhatIfDataDomainImpactDto(
        UUID id,
        String code,
        String name,
        String groupName,
        List<String> affectedApiNames,
        int alternativeProviderCount,
        boolean orphaned
) {}
