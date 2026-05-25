package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.List;
import java.util.UUID;

public record ApiGraphSearchCriteria(
        List<UUID> systemIds,
        List<UUID> typeIds,
        List<UUID> transportLayerIds,
        List<String> apiTags,
        List<String> systemTags,
        String apiQuery,
        String systemNameQuery,
        List<UUID> statusIds,
        String dataDomainQuery
) {}
