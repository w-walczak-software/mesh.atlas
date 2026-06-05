package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.UUID;

public record BlastRadiusNodeDto(
        UUID id,
        String code,
        String name,
        String nodeType,
        String icon,
        String statusName
) {}
