package pl.com.ww.mesh.atlas.integration.application.dto;

import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record StagingItSystemOwnerDto(
        UUID id,
        String systemExternalId,
        String externalId,
        String firstName,
        String lastName,
        String email,
        String rawRole,
        LocalDate validFrom,
        LocalDate validTo,
        StagingStatus stagingStatus,
        String errorMessage,
        LocalDateTime processedAt,
        LocalDateTime createdAt
) {}
