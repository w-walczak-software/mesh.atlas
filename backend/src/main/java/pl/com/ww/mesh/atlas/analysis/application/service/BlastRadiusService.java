package pl.com.ww.mesh.atlas.analysis.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusImpactedApiDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusImpactedSystemDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusNodeDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusRequest;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusResultDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastSeverity;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlastRadiusService {

    private final ApiRepository apiRepository;
    private final ItSystemRepository itSystemRepository;

    @Transactional(readOnly = true)
    public BlastRadiusResultDto analyze(BlastRadiusRequest request) {
        if (request.systemId() == null && request.apiId() == null) {
            throw new IllegalArgumentException("Either systemId or apiId must be provided");
        }

        int maxDepth = Math.max(1, Math.min(request.maxDepth(), 10));

        Set<UUID> visitedSystems = new LinkedHashSet<>();
        Set<UUID> visitedApis    = new LinkedHashSet<>();
        Map<UUID, Integer>        systemDepths  = new LinkedHashMap<>();
        Map<UUID, Integer>        apiDepths     = new LinkedHashMap<>();
        Map<UUID, ItSystemEntity> systemDetails = new LinkedHashMap<>();
        Map<UUID, ApiEntity>      apiDetails    = new LinkedHashMap<>();

        BlastRadiusNodeDto origin;
        boolean[] maxDepthReachedHolder = { false };

        if (request.systemId() != null) {
            ItSystemEntity startSystem = itSystemRepository.findById(request.systemId())
                    .orElseThrow(() -> new AtlasItSystemNotFoundException(request.systemId().toString()));
            origin = toSystemNode(startSystem);
            visitedSystems.add(startSystem.getId());
            bfsFromSystem(startSystem.getId(), 0, maxDepth,
                    visitedSystems, visitedApis, systemDepths, apiDepths,
                    systemDetails, apiDetails, maxDepthReachedHolder);
        } else {
            ApiEntity startApi = apiRepository.findById(request.apiId())
                    .orElseThrow(() -> new AtlasApiNotFoundException(request.apiId().toString()));
            origin = toApiNode(startApi);
            visitedApis.add(startApi.getId());
            bfsFromApi(startApi, maxDepth,
                    visitedSystems, visitedApis, systemDepths, apiDepths,
                    systemDetails, apiDetails, maxDepthReachedHolder);
        }

        List<BlastRadiusImpactedSystemDto> impactedSystems = systemDetails.entrySet().stream()
                .map(e -> toImpactedSystem(e.getValue(), systemDepths.get(e.getKey())))
                .sorted((a, b) -> Integer.compare(a.depth(), b.depth()))
                .toList();

        List<BlastRadiusImpactedApiDto> impactedApis = apiDetails.entrySet().stream()
                .map(e -> toImpactedApi(e.getValue(), apiDepths.get(e.getKey())))
                .sorted((a, b) -> Integer.compare(a.depth(), b.depth()))
                .toList();

        return new BlastRadiusResultDto(
                origin,
                impactedSystems,
                impactedApis,
                impactedSystems.size(),
                impactedApis.size(),
                computeSeverity(impactedSystems.size()),
                maxDepthReachedHolder[0],
                LocalDateTime.now()
        );
    }

    private void bfsFromSystem(UUID startSystemId, int startDepth, int maxDepth,
                                Set<UUID> visitedSystems, Set<UUID> visitedApis,
                                Map<UUID, Integer> systemDepths, Map<UUID, Integer> apiDepths,
                                Map<UUID, ItSystemEntity> systemDetails, Map<UUID, ApiEntity> apiDetails,
                                boolean[] maxDepthReached) {

        record QueueItem(UUID systemId, int depth) {}
        var queue = new ArrayDeque<QueueItem>();
        queue.add(new QueueItem(startSystemId, startDepth));

        while (!queue.isEmpty()) {
            var item = queue.poll();

            if (item.depth() >= maxDepth) {
                maxDepthReached[0] = true;
                continue;
            }

            List<ApiEntity> producedApis = apiRepository.findAllByProducerSystemIdAndActive(item.systemId(), true);
            for (ApiEntity api : producedApis) {
                if (visitedApis.add(api.getId())) {
                    int apiDepth = item.depth() + 1;
                    apiDepths.put(api.getId(), apiDepth);
                    apiDetails.put(api.getId(), api);

                    for (ItSystemEntity consumer : api.getConsumerSystems()) {
                        if (visitedSystems.add(consumer.getId())) {
                            systemDepths.put(consumer.getId(), apiDepth);
                            systemDetails.put(consumer.getId(), consumer);
                            queue.add(new QueueItem(consumer.getId(), apiDepth));
                        }
                    }
                }
            }
        }
    }

    private void bfsFromApi(ApiEntity startApi, int maxDepth,
                             Set<UUID> visitedSystems, Set<UUID> visitedApis,
                             Map<UUID, Integer> systemDepths, Map<UUID, Integer> apiDepths,
                             Map<UUID, ItSystemEntity> systemDetails, Map<UUID, ApiEntity> apiDetails,
                             boolean[] maxDepthReached) {

        record QueueItem(UUID systemId, int depth) {}
        var queue = new ArrayDeque<QueueItem>();

        for (ItSystemEntity consumer : startApi.getConsumerSystems()) {
            if (visitedSystems.add(consumer.getId())) {
                systemDepths.put(consumer.getId(), 1);
                systemDetails.put(consumer.getId(), consumer);
                queue.add(new QueueItem(consumer.getId(), 1));
            }
        }

        while (!queue.isEmpty()) {
            var item = queue.poll();

            if (item.depth() >= maxDepth) {
                maxDepthReached[0] = true;
                continue;
            }

            List<ApiEntity> producedApis = apiRepository.findAllByProducerSystemIdAndActive(item.systemId(), true);
            for (ApiEntity api : producedApis) {
                if (visitedApis.add(api.getId())) {
                    apiDepths.put(api.getId(), item.depth());
                    apiDetails.put(api.getId(), api);

                    for (ItSystemEntity consumer : api.getConsumerSystems()) {
                        if (visitedSystems.add(consumer.getId())) {
                            int nextDepth = item.depth() + 1;
                            systemDepths.put(consumer.getId(), nextDepth);
                            systemDetails.put(consumer.getId(), consumer);
                            queue.add(new QueueItem(consumer.getId(), nextDepth));
                        }
                    }
                }
            }
        }
    }

    private BlastSeverity computeSeverity(int impactedSystemCount) {
        if (impactedSystemCount == 0)  return BlastSeverity.NONE;
        if (impactedSystemCount <= 3)  return BlastSeverity.LOW;
        if (impactedSystemCount <= 7)  return BlastSeverity.MEDIUM;
        if (impactedSystemCount <= 15) return BlastSeverity.HIGH;
        return BlastSeverity.CRITICAL;
    }

    private BlastRadiusNodeDto toSystemNode(ItSystemEntity s) {
        return new BlastRadiusNodeDto(
                s.getId(), s.getCode(), s.getName(), "SYSTEM", s.getIcon(),
                s.getStatus() != null ? s.getStatus().getName() : null
        );
    }

    private BlastRadiusNodeDto toApiNode(ApiEntity a) {
        return new BlastRadiusNodeDto(
                a.getId(), a.getCode(), a.getName(), "API", null,
                a.getStatus() != null ? a.getStatus().getName() : null
        );
    }

    private BlastRadiusImpactedSystemDto toImpactedSystem(ItSystemEntity s, int depth) {
        return new BlastRadiusImpactedSystemDto(
                s.getId(), s.getCode(), s.getName(), s.getIcon(),
                s.getStatus() != null ? s.getStatus().getName() : null,
                s.getBusinessCriticality() != null ? s.getBusinessCriticality().getName() : null,
                depth
        );
    }

    private BlastRadiusImpactedApiDto toImpactedApi(ApiEntity a, int depth) {
        return new BlastRadiusImpactedApiDto(
                a.getId(), a.getCode(), a.getName(), a.getApiVersion(),
                a.getTransportLayer() != null ? a.getTransportLayer().getName() : null,
                a.getProducerSystem() != null ? a.getProducerSystem().getId() : null,
                a.getProducerSystem() != null ? a.getProducerSystem().getName() : null,
                depth
        );
    }
}
