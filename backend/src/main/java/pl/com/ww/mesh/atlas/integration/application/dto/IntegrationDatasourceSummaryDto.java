package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.DatasourceType;

import java.util.UUID;

public record IntegrationDatasourceSummaryDto(
        UUID id,
        String code,
        String name,
        DatasourceType type,
        String host,
        int port,
        String databaseName,
        boolean active
) {}
