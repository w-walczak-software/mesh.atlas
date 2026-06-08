package pl.com.ww.mesh.atlas.changerequest.application.dto;

import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewDecision;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewerRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChangeRequestReviewDto(
        UUID id,
        ReviewerRole reviewerRole,
        String reviewerName,
        String reviewerEmail,
        ReviewDecision decision,
        String comment,
        LocalDateTime reviewedAt
) {}
