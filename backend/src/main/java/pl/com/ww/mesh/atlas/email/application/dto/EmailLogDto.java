package pl.com.ww.mesh.atlas.email.application.dto;

import java.util.UUID;

public record EmailLogDto(
        UUID id,
        String sentAt,
        String recipient,
        String subject,
        String status,
        String errorMessage,
        String sentBy,
        boolean test
) {}
