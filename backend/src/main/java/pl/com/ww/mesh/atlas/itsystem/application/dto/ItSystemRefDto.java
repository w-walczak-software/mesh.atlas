package pl.com.ww.mesh.atlas.itsystem.application.dto;

import java.util.UUID;

public record ItSystemRefDto(
        UUID id,
        String code,
        String name,
        String icon
) {}
