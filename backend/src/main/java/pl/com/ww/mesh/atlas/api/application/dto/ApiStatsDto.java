package pl.com.ww.mesh.atlas.api.application.dto;

public record ApiStatsDto(
        long total,
        long active,
        long inactive,
        long addedLastMonth,
        long withSla,
        long withDocumentation,
        long withVersion
) {}
