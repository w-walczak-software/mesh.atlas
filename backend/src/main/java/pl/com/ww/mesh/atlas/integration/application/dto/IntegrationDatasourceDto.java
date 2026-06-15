package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.DatasourceType;

import java.time.LocalDateTime;
import java.util.UUID;

public record IntegrationDatasourceDto(
        UUID id,
        String code,
        String name,
        String description,
        DatasourceType type,
        String host,
        int port,
        String databaseName,
        String username,
        boolean active,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
