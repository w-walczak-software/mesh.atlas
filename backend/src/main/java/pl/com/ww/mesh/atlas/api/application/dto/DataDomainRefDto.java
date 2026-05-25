package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record DataDomainRefDto(
        UUID id,
        String code,
        String name
) {}
