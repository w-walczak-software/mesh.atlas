package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.UUID;

public record WhatIfScenarioNodeDto(
        UUID id,
        String code,
        String name,
        String icon,
        String statusName,
        String businessCriticalityName,
        String lifecycleStageName
) {}
