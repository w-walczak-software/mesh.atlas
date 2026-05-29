package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.List;
import java.util.UUID;

public record ApiGraphSearchCriteria(
        /** OR filter: APIs where any of these systems appears as producer OR consumer (IT Systems flow) */
        List<UUID> systemIds,
        /** Producer filter: APIs where producer is one of these systems */
        List<UUID> producerSystemIds,
        /** Consumer filter: APIs where at least one consumer is in this list */
        List<UUID> consumerSystemIds,
        List<UUID> typeIds,
        List<UUID> transportLayerIds,
        List<UUID> integrationPatternIds,
        List<UUID> environmentIds,
        List<UUID> dataDomainIds,
        List<String> apiTags,
        List<String> systemTags,
        String apiQuery,
        String systemNameQuery,
        List<UUID> statusIds,
        String dataDomainQuery,
        List<UUID> apiIds
) {}
