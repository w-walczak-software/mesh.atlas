package pl.com.ww.mesh.atlas.changerequest.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewDecision;

import java.time.LocalDate;

public record ChangeRequestReviewRequest(

        @NotNull
        ReviewDecision decision,

        @Size(max = 4000)
        String comment,

        LocalDate plannedImplementationDate,

        @Size(max = 50)
        String plannedVersion
) {}
