package pl.com.ww.mesh.atlas.transportlayer.application.dto;

import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;

import java.util.Map;
import java.util.UUID;

public record TransportLayerSummaryDto(
        UUID id,
        String code,
        String name,
        String icon,
        String color,
        Map<String, Object> metadata,
        ItSystemRefDto itSystem,
        boolean active
) {}
