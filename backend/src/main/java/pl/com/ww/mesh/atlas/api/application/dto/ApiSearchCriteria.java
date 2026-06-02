package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.List;
import java.util.UUID;

public record ApiSearchCriteria(
        String query,
        UUID statusId,
        UUID typeId,
        UUID transportLayerId,
        Boolean active,
        List<UUID> producerSystemIds,
        List<UUID> consumerSystemIds,
        String tag,
        UUID environmentId,
        String description,
        UUID integrationPatternId,
        List<UUID> dataDomainIds,
        Boolean pendingVerificationOnly
) {}
