package pl.com.ww.mesh.atlas.analysis.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfAffectedSystemDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfDataDomainImpactDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfDecommissionedApiDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfRecommendationDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfRecommendationLevel;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfRequest;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfResultDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfRisk;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfScenarioNodeDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfScenarioType;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WhatIfService {

    private final ApiRepository apiRepository;
    private final ItSystemRepository itSystemRepository;

    @Transactional(readOnly = true)
    public WhatIfResultDto analyze(WhatIfRequest request) {
        ItSystemEntity origin = itSystemRepository.findById(request.systemId())
                .orElseThrow(() -> new AtlasItSystemNotFoundException(request.systemId().toString()));

        int maxDepth = Math.max(1, Math.min(request.maxDepth(), 10));

        // ── Phase 1: APIs that would go offline ───────────────────────────
        List<ApiEntity> decommissionedApis =
                apiRepository.findAllByProducerSystemIdAndActive(origin.getId(), true);

        // ── Phase 2: Direct consumers (depth 1) + data domain inventory ──
        // systemId → set of API names directly consumed from the shutting-down system
        Map<UUID, Set<String>> directConsumedApiNames = new LinkedHashMap<>();
        // systemId → entity
        Map<UUID, ItSystemEntity> systemDetails = new LinkedHashMap<>();
        // systemId → depth
        Map<UUID, Integer> systemDepths = new LinkedHashMap<>();

        // dataDomainId → entity
        Map<UUID, DataDomainEntity> domainDetails = new LinkedHashMap<>();
        // dataDomainId → API names from the shutting-down system that served this domain
        Map<UUID, List<String>> domainToApiNames = new LinkedHashMap<>();

        for (ApiEntity api : decommissionedApis) {
            for (ItSystemEntity consumer : api.getConsumerSystems()) {
                if (!consumer.isActive() || consumer.getId().equals(origin.getId())) continue;
                systemDetails.putIfAbsent(consumer.getId(), consumer);
                systemDepths.putIfAbsent(consumer.getId(), 1);
                directConsumedApiNames
                        .computeIfAbsent(consumer.getId(), k -> new LinkedHashSet<>())
                        .add(api.getName());
            }
            for (DataDomainEntity domain : api.getDataDomains()) {
                domainDetails.putIfAbsent(domain.getId(), domain);
                domainToApiNames
                        .computeIfAbsent(domain.getId(), k -> new ArrayList<>())
                        .add(api.getName());
            }
        }

        // ── Phase 3: BFS cascading effects (depth 2+) ────────────────────
        record QueueItem(UUID systemId, int depth) {}
        var queue = new ArrayDeque<QueueItem>();
        boolean[] maxDepthReached = {false};

        for (UUID id : new ArrayList<>(systemDetails.keySet())) {
            queue.add(new QueueItem(id, 1));
        }

        while (!queue.isEmpty()) {
            var item = queue.poll();

            if (item.depth() >= maxDepth) {
                maxDepthReached[0] = true;
                continue;
            }

            List<ApiEntity> producedApis =
                    apiRepository.findAllByProducerSystemIdAndActive(item.systemId(), true);

            for (ApiEntity api : producedApis) {
                for (ItSystemEntity consumer : api.getConsumerSystems()) {
                    if (!consumer.isActive()) continue;
                    if (consumer.getId().equals(origin.getId())) continue;
                    if (systemDetails.containsKey(consumer.getId())) continue;

                    int nextDepth = item.depth() + 1;
                    systemDetails.put(consumer.getId(), consumer);
                    systemDepths.put(consumer.getId(), nextDepth);
                    directConsumedApiNames.putIfAbsent(consumer.getId(), new LinkedHashSet<>());
                    queue.add(new QueueItem(consumer.getId(), nextDepth));
                }
            }
        }

        // ── Phase 4: Data domain alternative provider check ───────────────
        List<WhatIfDataDomainImpactDto> domainImpacts = domainDetails.entrySet().stream()
                .map(e -> {
                    UUID domainId = e.getKey();
                    DataDomainEntity domain = e.getValue();
                    List<ApiEntity> alternatives =
                            apiRepository.findAlternativeActiveApisByDataDomain(domainId, origin.getId());
                    return new WhatIfDataDomainImpactDto(
                            domain.getId(),
                            domain.getCode(),
                            domain.getName(),
                            domain.getGroup() != null ? domain.getGroup().getName() : null,
                            domainToApiNames.getOrDefault(domainId, List.of()),
                            alternatives.size(),
                            alternatives.isEmpty()
                    );
                })
                .sorted(Comparator.comparing(WhatIfDataDomainImpactDto::orphaned).reversed()
                        .thenComparing(WhatIfDataDomainImpactDto::name))
                .toList();

        int orphanedCount = (int) domainImpacts.stream().filter(WhatIfDataDomainImpactDto::orphaned).count();

        // ── Phase 5: Risk per affected system ────────────────────────────
        List<WhatIfAffectedSystemDto> affectedSystems = systemDetails.entrySet().stream()
                .map(e -> {
                    UUID sysId = e.getKey();
                    ItSystemEntity sys = e.getValue();
                    int depth = systemDepths.get(sysId);
                    List<String> consumedApis = new ArrayList<>(
                            directConsumedApiNames.getOrDefault(sysId, new LinkedHashSet<>()));
                    WhatIfRisk risk = computeSystemRisk(sys, consumedApis.size());
                    return new WhatIfAffectedSystemDto(
                            sys.getId(), sys.getCode(), sys.getName(), sys.getIcon(),
                            sys.getStatus() != null ? sys.getStatus().getName() : null,
                            sys.getBusinessCriticality() != null ? sys.getBusinessCriticality().getName() : null,
                            sys.getLifecycleStage() != null ? sys.getLifecycleStage().getName() : null,
                            consumedApis,
                            depth,
                            risk
                    );
                })
                .sorted(Comparator.comparing(WhatIfAffectedSystemDto::risk).reversed()
                        .thenComparing(WhatIfAffectedSystemDto::depth)
                        .thenComparing(WhatIfAffectedSystemDto::name))
                .toList();

        // ── Phase 6: Decommissioned API DTOs ─────────────────────────────
        List<WhatIfDecommissionedApiDto> apiDtos = decommissionedApis.stream()
                .map(api -> new WhatIfDecommissionedApiDto(
                        api.getId(), api.getCode(), api.getName(), api.getApiVersion(),
                        api.getTransportLayer() != null ? api.getTransportLayer().getName() : null,
                        api.getStatus() != null ? api.getStatus().getName() : null,
                        api.getSlaTier() != null ? api.getSlaTier().getName() : null,
                        api.getDataDomains().stream().map(DataDomainEntity::getName).sorted().toList(),
                        (int) api.getConsumerSystems().stream().filter(ItSystemEntity::isActive).count()
                ))
                .sorted(Comparator.comparing(WhatIfDecommissionedApiDto::directConsumerCount).reversed()
                        .thenComparing(WhatIfDecommissionedApiDto::name))
                .toList();

        // ── Phase 7: Overall risk ─────────────────────────────────────────
        WhatIfRisk overallRisk = computeOverallRisk(affectedSystems, orphanedCount);

        // ── Phase 8: Recommendations ─────────────────────────────────────
        List<WhatIfRecommendationDto> recommendations =
                generateRecommendations(origin, apiDtos, affectedSystems, domainImpacts, orphanedCount);

        return new WhatIfResultDto(
                toOriginNode(origin),
                WhatIfScenarioType.SYSTEM_SHUTDOWN,
                apiDtos,
                affectedSystems,
                domainImpacts,
                apiDtos.size(),
                affectedSystems.size(),
                domainImpacts.size(),
                orphanedCount,
                overallRisk,
                maxDepthReached[0],
                recommendations,
                LocalDateTime.now()
        );
    }

    // ── Risk computation ─────────────────────────────────────────────────────

    private WhatIfRisk computeSystemRisk(ItSystemEntity system, int directApiCount) {
        int critScore = criticalityScore(system);
        // Depth-1 systems have real API linkage; cascade systems default score of 1
        int score = critScore * Math.max(directApiCount, 1);
        return scoreToRisk(score);
    }

    private WhatIfRisk computeOverallRisk(List<WhatIfAffectedSystemDto> systems, int orphanedDomains) {
        WhatIfRisk maxSystemRisk = systems.stream()
                .map(WhatIfAffectedSystemDto::risk)
                .max(Comparator.naturalOrder())
                .orElse(WhatIfRisk.NONE);

        if (orphanedDomains > 0 && maxSystemRisk.ordinal() < WhatIfRisk.HIGH.ordinal()) {
            return WhatIfRisk.HIGH;
        }
        return maxSystemRisk;
    }

    private int criticalityScore(ItSystemEntity system) {
        if (system.getBusinessCriticality() == null) return 1;
        String code = system.getBusinessCriticality().getCode().toUpperCase();
        if (code.contains("CRITICAL")) return 4;
        if (code.contains("HIGH"))     return 3;
        if (code.contains("MEDIUM"))   return 2;
        return 1;
    }

    private WhatIfRisk scoreToRisk(int score) {
        if (score == 0)  return WhatIfRisk.NONE;
        if (score <= 3)  return WhatIfRisk.LOW;
        if (score <= 9)  return WhatIfRisk.MEDIUM;
        if (score <= 18) return WhatIfRisk.HIGH;
        return WhatIfRisk.CRITICAL;
    }

    // ── Recommendations ──────────────────────────────────────────────────────

    private List<WhatIfRecommendationDto> generateRecommendations(
            ItSystemEntity origin,
            List<WhatIfDecommissionedApiDto> apis,
            List<WhatIfAffectedSystemDto> systems,
            List<WhatIfDataDomainImpactDto> domains,
            int orphanedDomains
    ) {
        List<WhatIfRecommendationDto> recs = new ArrayList<>();

        if (orphanedDomains > 0) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.CRITICAL,
                    orphanedDomains + " data domain(s) will have no alternative data provider after decommissioning. " +
                    "Immediate data migration or ownership transfer plan is required."
            ));
        }

        long criticalOrHighSystems = systems.stream()
                .filter(s -> s.risk() == WhatIfRisk.CRITICAL || s.risk() == WhatIfRisk.HIGH)
                .count();
        if (criticalOrHighSystems > 0) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.CRITICAL,
                    criticalOrHighSystems + " critical/high-risk system(s) depend on \"" + origin.getName() +
                    "\". Mandatory SLA continuity review and executive sign-off required before decommissioning."
            ));
        }

        long goldSlaApis = apis.stream()
                .filter(a -> a.slaTierName() != null && a.slaTierName().toUpperCase().contains("GOLD"))
                .count();
        if (goldSlaApis > 0) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.CRITICAL,
                    goldSlaApis + " Gold SLA API(s) will be decommissioned. Consumer notification is required " +
                    "per contractual SLA terms. Coordinate with API governance board."
            ));
        }

        long partialDomains = domains.stream()
                .filter(d -> !d.orphaned() && d.alternativeProviderCount() > 0)
                .count();
        if (partialDomains > 0) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.WARNING,
                    partialDomains + " data domain(s) have alternative providers available. " +
                    "Validate that alternative APIs are functionally equivalent and consumers are migrated before decommissioning."
            ));
        }

        if (!systems.isEmpty()) {
            long directSystems = systems.stream().filter(s -> s.depth() == 1).count();
            long cascadeSystems = systems.size() - directSystems;
            String msg = "Notify " + directSystems + " direct consumer team(s) and establish a migration timeline with clear milestones.";
            if (cascadeSystems > 0) {
                msg += " Additionally, " + cascadeSystems + " cascading system(s) may be indirectly disrupted.";
            }
            recs.add(new WhatIfRecommendationDto(WhatIfRecommendationLevel.WARNING, msg));
        }

        long silverSlaApis = apis.stream()
                .filter(a -> a.slaTierName() != null && a.slaTierName().toUpperCase().contains("SILVER"))
                .count();
        if (silverSlaApis > 0) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.WARNING,
                    silverSlaApis + " Silver SLA API(s) will be decommissioned. Advance consumer notification required per SLA policy."
            ));
        }

        if (!apis.isEmpty()) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.INFO,
                    "Run a Blast Radius analysis on each direct consumer system to assess full secondary cascading effects before finalising the decommissioning plan."
            ));
        }

        if (recs.isEmpty()) {
            recs.add(new WhatIfRecommendationDto(
                    WhatIfRecommendationLevel.INFO,
                    "No critical dependencies detected. Proceed with the standard decommissioning checklist."
            ));
        }

        return recs;
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    private WhatIfScenarioNodeDto toOriginNode(ItSystemEntity s) {
        return new WhatIfScenarioNodeDto(
                s.getId(), s.getCode(), s.getName(), s.getIcon(),
                s.getStatus() != null ? s.getStatus().getName() : null,
                s.getBusinessCriticality() != null ? s.getBusinessCriticality().getName() : null,
                s.getLifecycleStage() != null ? s.getLifecycleStage().getName() : null
        );
    }
}
