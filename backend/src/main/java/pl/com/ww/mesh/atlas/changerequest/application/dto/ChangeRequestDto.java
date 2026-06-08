package pl.com.ww.mesh.atlas.changerequest.application.dto;

import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;
import pl.com.ww.mesh.atlas.changerequest.domain.model.RequesterType;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ChangeRequestDto(
        UUID id,
        UUID apiId,
        String apiCode,
        String apiName,
        String apiVersion,
        String producerSystemName,
        String title,
        String description,
        DictionaryEntryRefDto changeType,
        DictionaryEntryRefDto priority,
        ChangeRequestStatus status,
        RequesterType requesterType,
        String requesterEmail,
        String requesterName,
        LocalDate plannedImplementationDate,
        String plannedVersion,
        LocalDateTime implementedAt,
        String implementedVersion,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy,
        List<ChangeRequestReviewDto> reviews
) {}
