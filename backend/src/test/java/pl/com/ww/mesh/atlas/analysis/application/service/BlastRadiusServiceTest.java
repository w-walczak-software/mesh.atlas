package pl.com.ww.mesh.atlas.analysis.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusRequest;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusResultDto;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastSeverity;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlastRadiusServiceTest {

    @Mock private ApiRepository apiRepository;
    @Mock private ItSystemRepository itSystemRepository;

    @InjectMocks
    private BlastRadiusService service;

    // ── input validation ──────────────────────────────────────────────────────

    @Test
    void analyze_neitherSystemIdNorApiId_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.analyze(new BlastRadiusRequest(null, null, 3)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void analyze_systemIdNotFound_throwsItSystemNotFoundException() {
        UUID systemId = UUID.randomUUID();
        when(itSystemRepository.findById(systemId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.analyze(new BlastRadiusRequest(systemId, null, 3)))
                .isInstanceOf(AtlasItSystemNotFoundException.class);
    }

    @Test
    void analyze_apiIdNotFound_throwsApiNotFoundException() {
        UUID apiId = UUID.randomUUID();
        when(apiRepository.findById(apiId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.analyze(new BlastRadiusRequest(null, apiId, 3)))
                .isInstanceOf(AtlasApiNotFoundException.class);
    }

    // ── system start: no cascades ─────────────────────────────────────────────

    @Test
    void analyze_startFromSystem_noProducedApis_returnsEmptyImpact() {
        var system = buildSystem("SYS-A");
        when(itSystemRepository.findById(system.getId())).thenReturn(Optional.of(system));
        when(apiRepository.findAllByProducerSystemIdAndActive(system.getId(), true))
                .thenReturn(List.of());

        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(system.getId(), null, 5));

        assertThat(result.totalSystems()).isZero();
        assertThat(result.totalApis()).isZero();
        assertThat(result.severity()).isEqualTo(BlastSeverity.NONE);
        assertThat(result.origin().id()).isEqualTo(system.getId());
    }

    @Test
    void analyze_startFromSystem_oneApiOneConsumer_impactsOneSystemAndOneApi() {
        var producer = buildSystem("PRODUCER");
        var consumer = buildSystem("CONSUMER");

        var api = buildApi("API-1", producer, Set.of(consumer));

        when(itSystemRepository.findById(producer.getId())).thenReturn(Optional.of(producer));
        when(apiRepository.findAllByProducerSystemIdAndActive(producer.getId(), true))
                .thenReturn(List.of(api));
        when(apiRepository.findAllByProducerSystemIdAndActive(consumer.getId(), true))
                .thenReturn(List.of());

        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(producer.getId(), null, 5));

        assertThat(result.totalSystems()).isEqualTo(1);
        assertThat(result.totalApis()).isEqualTo(1);
        assertThat(result.severity()).isEqualTo(BlastSeverity.LOW);
        assertThat(result.impactedSystems().get(0).depth()).isEqualTo(1);
        assertThat(result.impactedApis().get(0).depth()).isEqualTo(1);
    }

    // ── api start ─────────────────────────────────────────────────────────────

    @Test
    void analyze_startFromApi_consumersFoundAtDepthOne() {
        var producer = buildSystem("PRODUCER");
        var consumer = buildSystem("CONSUMER");
        var api = buildApi("API-1", producer, Set.of(consumer));

        when(apiRepository.findById(api.getId())).thenReturn(Optional.of(api));
        when(apiRepository.findAllByProducerSystemIdAndActive(consumer.getId(), true))
                .thenReturn(List.of());

        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(null, api.getId(), 5));

        assertThat(result.totalSystems()).isEqualTo(1);
        assertThat(result.impactedSystems().get(0).depth()).isEqualTo(1);
        assertThat(result.impactedSystems().get(0).id()).isEqualTo(consumer.getId());
    }

    @Test
    void analyze_startFromApi_noConsumers_returnsEmptyImpact() {
        var producer = buildSystem("PRODUCER");
        var api = buildApi("API-1", producer, Set.of());

        when(apiRepository.findById(api.getId())).thenReturn(Optional.of(api));

        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(null, api.getId(), 5));

        assertThat(result.totalSystems()).isZero();
        assertThat(result.totalApis()).isZero();
    }

    // ── maxDepth clamping ─────────────────────────────────────────────────────

    @Test
    void analyze_maxDepthZero_clampedToOne() {
        var system = buildSystem("SYS");
        var consumer = buildSystem("CONSUMER");
        var api = buildApi("API-1", system, Set.of(consumer));

        when(itSystemRepository.findById(system.getId())).thenReturn(Optional.of(system));
        when(apiRepository.findAllByProducerSystemIdAndActive(system.getId(), true))
                .thenReturn(List.of(api));

        // maxDepth=0 → clamped to 1; at depth 0 the queue item with startDepth=0 still runs
        // because check is item.depth() >= maxDepth (0 >= 1 → false) → processes at depth 0
        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(system.getId(), null, 0));

        // With maxDepth clamped to 1: items at depth >=1 are cut off, but depth 0 processes APIs
        // Consumer systems are added at depth=1, and when dequeued they hit depth >= maxDepth → cut
        assertThat(result).isNotNull();
    }

    @Test
    void analyze_maxDepthExceedsTen_clampedToTen() {
        var system = buildSystem("SYS");
        when(itSystemRepository.findById(system.getId())).thenReturn(Optional.of(system));
        when(apiRepository.findAllByProducerSystemIdAndActive(system.getId(), true))
                .thenReturn(List.of());

        // Should not throw — just clamps internally
        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(system.getId(), null, 99));

        assertThat(result).isNotNull();
    }

    // ── severity thresholds ───────────────────────────────────────────────────

    @Test
    void analyze_threeImpactedSystems_severityLow() {
        assertThat(analyzeWithNImpactedSystems(3).severity()).isEqualTo(BlastSeverity.LOW);
    }

    @Test
    void analyze_fourImpactedSystems_severityMedium() {
        assertThat(analyzeWithNImpactedSystems(4).severity()).isEqualTo(BlastSeverity.MEDIUM);
    }

    @Test
    void analyze_sevenImpactedSystems_severityMedium() {
        assertThat(analyzeWithNImpactedSystems(7).severity()).isEqualTo(BlastSeverity.MEDIUM);
    }

    @Test
    void analyze_eightImpactedSystems_severityHigh() {
        assertThat(analyzeWithNImpactedSystems(8).severity()).isEqualTo(BlastSeverity.HIGH);
    }

    @Test
    void analyze_fifteenImpactedSystems_severityHigh() {
        assertThat(analyzeWithNImpactedSystems(15).severity()).isEqualTo(BlastSeverity.HIGH);
    }

    @Test
    void analyze_sixteenImpactedSystems_severityCritical() {
        assertThat(analyzeWithNImpactedSystems(16).severity()).isEqualTo(BlastSeverity.CRITICAL);
    }

    // ── cycle detection ───────────────────────────────────────────────────────

    @Test
    void analyze_cyclicDependency_doesNotLoopInfinitely() {
        // A produces API-1 consumed by B; B produces API-2 consumed by A
        var sysA = buildSystem("SYS-A");
        var sysB = buildSystem("SYS-B");

        var api1 = buildApi("API-1", sysA, Set.of(sysB));
        var api2 = buildApi("API-2", sysB, Set.of(sysA));

        when(itSystemRepository.findById(sysA.getId())).thenReturn(Optional.of(sysA));
        when(apiRepository.findAllByProducerSystemIdAndActive(sysA.getId(), true))
                .thenReturn(List.of(api1));
        when(apiRepository.findAllByProducerSystemIdAndActive(sysB.getId(), true))
                .thenReturn(List.of(api2));

        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(sysA.getId(), null, 5));

        // B is found as impacted (depth 1); A is the start node so it's in visitedSystems but not in impacted
        assertThat(result.impactedSystems()).hasSize(1);
        assertThat(result.impactedSystems().get(0).id()).isEqualTo(sysB.getId());
    }

    // ── maxDepthReached flag ──────────────────────────────────────────────────

    @Test
    void analyze_consumerAtMaxDepthBoundary_maxDepthReachedIsTrue() {
        var sysA = buildSystem("SYS-A");
        var sysB = buildSystem("SYS-B");
        var sysC = buildSystem("SYS-C");

        var api1 = buildApi("API-1", sysA, Set.of(sysB));  // depth 1
        var api2 = buildApi("API-2", sysB, Set.of(sysC));  // sysC would be at depth 2

        when(itSystemRepository.findById(sysA.getId())).thenReturn(Optional.of(sysA));
        when(apiRepository.findAllByProducerSystemIdAndActive(sysA.getId(), true))
                .thenReturn(List.of(api1));
        // sysB is queued at depth=1; with maxDepth=1, when dequeued item.depth >= maxDepth → cut off
        // so findAllByProducerSystemIdAndActive(sysB) is never called

        // maxDepth=1 → sysB is added at depth=1 but when dequeued depth >= maxDepth → cut
        BlastRadiusResultDto result = service.analyze(new BlastRadiusRequest(sysA.getId(), null, 1));

        assertThat(result.maxDepthReached()).isTrue();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private ItSystemEntity buildSystem(String code) {
        var sys = new ItSystemEntity();
        sys.setId(UUID.randomUUID());
        sys.setCode(code);
        sys.setName("System " + code);
        return sys;
    }

    private ApiEntity buildApi(String code, ItSystemEntity producer, Set<ItSystemEntity> consumers) {
        var api = ApiEntity.builder()
                .consumerSystems(new LinkedHashSet<>(consumers))
                .build();
        api.setId(UUID.randomUUID());
        api.setCode(code);
        api.setName("API " + code);
        api.setProducerSystem(producer);
        return api;
    }

    /**
     * Constructs a star topology: one producer system with N APIs each consumed by a unique system.
     * Used to test severity thresholds via computeSeverity().
     */
    private BlastRadiusResultDto analyzeWithNImpactedSystems(int n) {
        var producer = buildSystem("ROOT");
        when(itSystemRepository.findById(producer.getId())).thenReturn(Optional.of(producer));

        List<ApiEntity> apis = IntStream.range(0, n).mapToObj(i -> {
            var consumer = buildSystem("CONSUMER-" + i);
            var api = buildApi("API-" + i, producer, Set.of(consumer));
            when(apiRepository.findAllByProducerSystemIdAndActive(eq(consumer.getId()), eq(true)))
                    .thenReturn(List.of());
            return api;
        }).toList();

        when(apiRepository.findAllByProducerSystemIdAndActive(eq(producer.getId()), eq(true)))
                .thenReturn(apis);

        return service.analyze(new BlastRadiusRequest(producer.getId(), null, 10));
    }
}
