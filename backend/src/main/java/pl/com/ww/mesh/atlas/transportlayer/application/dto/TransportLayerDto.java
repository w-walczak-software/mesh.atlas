package pl.com.ww.mesh.atlas.transportlayer.application.dto;

import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TransportLayerDto(
        UUID id,
        String code,
        String name,
        String description,
        String icon,
        String color,
        ItSystemRefDto itSystem,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
