package pl.com.ww.mesh.atlas.datadomain.application.dto;

import java.util.List;
import java.util.UUID;

public record DataDomainSummaryDto(
        UUID id,
        String code,
        String name,
        String description,
        List<String> tags,
        boolean active
) {}
