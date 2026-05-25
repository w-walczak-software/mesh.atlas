package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.UUID;

public record ApiSearchCriteria(
        String query,
        UUID statusId,
        UUID typeId,
        UUID transportLayerId,
        Boolean active,
        UUID sourceSystemId,
        UUID targetSystemId,
        String tag
) {}
