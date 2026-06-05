package pl.com.ww.mesh.atlas.analysis.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public record BlastRadiusRequest(
        UUID systemId,
        UUID apiId,
        @Min(1) @Max(10) int maxDepth
) {}
