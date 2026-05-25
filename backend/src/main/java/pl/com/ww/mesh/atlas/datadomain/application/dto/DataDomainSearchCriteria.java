package pl.com.ww.mesh.atlas.datadomain.application.dto;

import java.util.UUID;

public record DataDomainSearchCriteria(
        String query,
        String tag,
        Boolean active,
        UUID groupId
) {}
