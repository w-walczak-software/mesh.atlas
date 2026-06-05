package pl.com.ww.mesh.atlas.analysis.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.analysis.application.dto.DeprecatedApiReportItemDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.DeprecationConsumerDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.DeprecationImpactResultDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.DeprecationRisk;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeprecationImpactService {

    private final ApiRepository apiRepository;

    @Transactional(readOnly = true)
    public DeprecationImpactResultDto analyze() {
        List<ApiEntity> deprecatedApis = apiRepository.findAllDeprecatedAndActive();

        List<DeprecatedApiReportItemDto> items = deprecatedApis.stream()
                .map(this::toReportItem)
                .sorted(Comparator.comparingInt((DeprecatedApiReportItemDto d) -> d.risk().ordinal()).reversed()
                        .thenComparing(DeprecatedApiReportItemDto::name))
                .toList();

        long totalAffectedSystems = items.stream()
                .flatMap(item -> item.consumers().stream())
                .map(DeprecationConsumerDto::id)
                .distinct()
                .count();

        DeprecationRisk overallRisk = items.stream()
                .map(DeprecatedApiReportItemDto::risk)
                .max(Comparator.naturalOrder())
                .orElse(DeprecationRisk.NONE);

        Map<DeprecationRisk, Long> distribution = Arrays.stream(DeprecationRisk.values())
                .collect(Collectors.toMap(
                        risk -> risk,
                        risk -> items.stream().filter(i -> i.risk() == risk).count()
                ));

        return new DeprecationImpactResultDto(
                items,
                items.size(),
                totalAffectedSystems,
                overallRisk,
                distribution,
                LocalDateTime.now()
        );
    }

    private DeprecatedApiReportItemDto toReportItem(ApiEntity api) {
        List<DeprecationConsumerDto> consumers = api.getConsumerSystems().stream()
                .filter(ItSystemEntity::isActive)
                .map(this::toConsumerDto)
                .sorted(Comparator.comparing(DeprecationConsumerDto::name))
                .toList();

        return new DeprecatedApiReportItemDto(
                api.getId(),
                api.getCode(),
                api.getName(),
                api.getApiVersion(),
                api.getStatus() != null ? api.getStatus().getName() : null,
                api.getGovernanceNote(),
                api.getProducerSystem() != null ? api.getProducerSystem().getId() : null,
                api.getProducerSystem() != null ? api.getProducerSystem().getName() : null,
                api.getProducerSystem() != null ? api.getProducerSystem().getIcon() : null,
                consumers,
                consumers.size(),
                computeRisk(consumers)
        );
    }

    private DeprecationConsumerDto toConsumerDto(ItSystemEntity system) {
        return new DeprecationConsumerDto(
                system.getId(),
                system.getCode(),
                system.getName(),
                system.getIcon(),
                system.getStatus() != null ? system.getStatus().getName() : null,
                system.getBusinessCriticality() != null ? system.getBusinessCriticality().getName() : null,
                system.getLifecycleStage() != null ? system.getLifecycleStage().getName() : null
        );
    }

    /**
     * Weighted risk score: critical consumer = 4pts, high = 3pts, medium = 2pts, other = 1pt.
     * Threshold: 0=NONE, ≤2=LOW, ≤8=MEDIUM, ≤16=HIGH, >16=CRITICAL.
     */
    private DeprecationRisk computeRisk(List<DeprecationConsumerDto> consumers) {
        if (consumers.isEmpty()) return DeprecationRisk.NONE;
        int score = consumers.stream()
                .mapToInt(c -> {
                    if (c.businessCriticalityName() == null) return 1;
                    String crit = c.businessCriticalityName().toUpperCase();
                    if (crit.contains("CRITICAL")) return 4;
                    if (crit.contains("HIGH"))     return 3;
                    if (crit.contains("MEDIUM"))   return 2;
                    return 1;
                })
                .sum();
        if (score <= 2)  return DeprecationRisk.LOW;
        if (score <= 8)  return DeprecationRisk.MEDIUM;
        if (score <= 16) return DeprecationRisk.HIGH;
        return DeprecationRisk.CRITICAL;
    }
}
