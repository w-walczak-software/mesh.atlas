package pl.com.ww.mesh.atlas.analysis.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record WhatIfRequest(
        @NotNull WhatIfScenarioType scenarioType,
        @NotNull UUID systemId,
        @Min(1) @Max(10) int maxDepth
) {}
