package pl.com.ww.mesh.atlas.changerequest.application.dto;

import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;

import java.time.LocalDate;
import java.util.UUID;

public record ChangeRequestSearchCriteria(
        UUID apiId,
        ChangeRequestStatus status,
        UUID changeTypeId,
        UUID priorityId,
        String requesterEmail,
        String searchText,
        LocalDate fromDate,
        LocalDate toDate
) {}
