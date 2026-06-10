package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;

import java.util.List;
import java.util.UUID;

public record ApiSummaryDto(
        UUID id,
        String code,
        String name,
        String apiVersion,
        DictionaryEntryRefDto type,
        DictionaryEntryRefDto status,
        ItSystemRefDto producerSystem,
        List<ItSystemRefDto> consumerSystems,
        TransportLayerRefDto transportLayer,
        List<String> tags,
        boolean active,
        GovernanceStatus governanceStatus,
        boolean canEdit,
        boolean canVerify,
        ApiRatingSummaryDto ratingsSummary
) {}
