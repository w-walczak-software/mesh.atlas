package pl.com.ww.mesh.atlas.itsystem.application.dto;

import java.util.UUID;

public record ItSystemSearchCriteria(
        String query,
        UUID statusId,
        UUID lifecycleStageId,
        UUID businessCriticalityId,
        UUID systemTypeId,
        Boolean active,
        String ownerQuery
) {}
