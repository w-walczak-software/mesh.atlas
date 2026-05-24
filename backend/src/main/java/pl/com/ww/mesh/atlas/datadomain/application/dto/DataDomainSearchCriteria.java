package pl.com.ww.mesh.atlas.datadomain.application.dto;

public record DataDomainSearchCriteria(
        String query,
        String tag,
        Boolean active
) {}
