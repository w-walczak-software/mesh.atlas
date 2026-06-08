package pl.com.ww.mesh.atlas.changerequest.application.dto;

import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;
import pl.com.ww.mesh.atlas.changerequest.domain.model.RequesterType;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ChangeRequestSummaryDto(
        UUID id,
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String title,
        DictionaryEntryRefDto changeType,
        DictionaryEntryRefDto priority,
        ChangeRequestStatus status,
        RequesterType requesterType,
        String requesterEmail,
        String requesterName,
        LocalDate plannedImplementationDate,
        String plannedVersion,
        LocalDateTime createdAt,
        boolean currentUserIsOwner,
        boolean currentUserIsRequester
) {}
