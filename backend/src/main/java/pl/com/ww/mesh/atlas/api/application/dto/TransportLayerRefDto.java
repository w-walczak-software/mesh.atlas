package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record TransportLayerRefDto(
        UUID id,
        String code,
        String name,
        String icon,
        String color
) {}
