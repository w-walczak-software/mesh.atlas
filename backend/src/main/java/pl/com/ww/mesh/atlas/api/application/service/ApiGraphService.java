package pl.com.ww.mesh.atlas.api.application.service;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaRoot;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphEdgeDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphResultDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphSystemDto;
import pl.com.ww.mesh.atlas.api.application.dto.TransportLayerRefDto;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiGraphService {

    private final ApiRepository apiRepository;
    private final ItSystemRepository itSystemRepository;

    public ApiGraphResultDto findForGraph(ApiGraphSearchCriteria criteria) {
        List<ApiEntity> apis = apiRepository.findAll(buildSpec(criteria));

        Map<UUID, ApiGraphSystemDto> systemMap = new LinkedHashMap<>();
        List<ApiGraphEdgeDto> edges = new ArrayList<>();

        for (ApiEntity api : apis) {
            if (!api.isActive()) continue;

            ItSystemEntity producer = api.getProducerSystem();
            if (producer != null) {
                systemMap.putIfAbsent(producer.getId(), toSystemDto(producer));
            }

            for (ItSystemEntity consumer : api.getConsumerSystems()) {
                systemMap.putIfAbsent(consumer.getId(), toSystemDto(consumer));
            }

            edges.add(toEdgeDto(api));
        }

        // Include explicitly requested systems even if they have no APIs
        addMissingSystems(systemMap, criteria);

        return new ApiGraphResultDto(new ArrayList<>(systemMap.values()), edges);
    }

    /**
     * Ensures that all explicitly requested systems appear in the graph even if they
     * have no APIs. When the criteria is completely empty (no system filter AND no
     * API-level filter), all active IT systems are included so isolated systems are
     * visible in the unfiltered "show all" view.
     */
    private void addMissingSystems(Map<UUID, ApiGraphSystemDto> systemMap, ApiGraphSearchCriteria criteria) {
        boolean hasSystemIds   = !CollectionUtils.isEmpty(criteria.systemIds());
        boolean hasProducerIds = !CollectionUtils.isEmpty(criteria.producerSystemIds());
        boolean hasConsumerIds = !CollectionUtils.isEmpty(criteria.consumerSystemIds());

        addByIds(systemMap, hasSystemIds   ? criteria.systemIds()         : null);
        addByIds(systemMap, hasProducerIds ? criteria.producerSystemIds() : null);
        addByIds(systemMap, hasConsumerIds ? criteria.consumerSystemIds() : null);

        // Only load all active systems when nothing is filtered at all — prevents
        // polluting API-specific views (e.g. apiIds selected) with unrelated systems.
        boolean hasApiFilter =
                !CollectionUtils.isEmpty(criteria.apiIds())
                || StringUtils.hasText(criteria.apiQuery())
                || StringUtils.hasText(criteria.systemNameQuery())
                || StringUtils.hasText(criteria.dataDomainQuery())
                || !CollectionUtils.isEmpty(criteria.typeIds())
                || !CollectionUtils.isEmpty(criteria.transportLayerIds())
                || !CollectionUtils.isEmpty(criteria.integrationPatternIds())
                || !CollectionUtils.isEmpty(criteria.environmentIds())
                || !CollectionUtils.isEmpty(criteria.dataDomainIds())
                || !CollectionUtils.isEmpty(criteria.statusIds())
                || !CollectionUtils.isEmpty(criteria.apiTags())
                || !CollectionUtils.isEmpty(criteria.systemTags());

        if (!hasSystemIds && !hasProducerIds && !hasConsumerIds && !hasApiFilter) {
            Specification<ItSystemEntity> activeSpec = (root, q, cb) -> cb.equal(root.get("active"), true);
            itSystemRepository.findAll(activeSpec)
                    .forEach(s -> systemMap.putIfAbsent(s.getId(), toSystemDto(s)));
        }
    }

    private void addByIds(Map<UUID, ApiGraphSystemDto> systemMap, List<UUID> ids) {
        if (CollectionUtils.isEmpty(ids)) return;
        Set<UUID> missing = ids.stream()
                .filter(id -> !systemMap.containsKey(id))
                .collect(Collectors.toSet());
        if (!missing.isEmpty()) {
            itSystemRepository.findAllById(missing)
                    .forEach(s -> systemMap.putIfAbsent(s.getId(), toSystemDto(s)));
        }
    }

    private Specification<ApiEntity> buildSpec(ApiGraphSearchCriteria criteria) {
        return (Root<ApiEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("active"), true));

            if (!CollectionUtils.isEmpty(criteria.apiIds())) {
                predicates.add(root.get("id").in(criteria.apiIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.systemIds())) {
                Predicate producerIn = root.get("producerSystem").get("id").in(criteria.systemIds());
                Join<ApiEntity, ItSystemEntity> consumerJoin = root.join("consumerSystems", JoinType.LEFT);
                Predicate consumerIn = consumerJoin.get("id").in(criteria.systemIds());
                predicates.add(cb.or(producerIn, consumerIn));
                query.distinct(true);
            }

            if (!CollectionUtils.isEmpty(criteria.producerSystemIds())) {
                predicates.add(root.get("producerSystem").get("id").in(criteria.producerSystemIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.consumerSystemIds())) {
                query.distinct(true);
                Join<ApiEntity, ItSystemEntity> consumerJoin = root.join("consumerSystems", JoinType.INNER);
                predicates.add(consumerJoin.get("id").in(criteria.consumerSystemIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.integrationPatternIds())) {
                predicates.add(root.get("integrationPattern").get("id").in(criteria.integrationPatternIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.environmentIds())) {
                query.distinct(true);
                Join<ApiEntity, Object> envJoin = root.join("environments", JoinType.INNER);
                predicates.add(envJoin.get("environment").get("id").in(criteria.environmentIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.dataDomainIds())) {
                query.distinct(true);
                Join<ApiEntity, Object> ddJoin = root.join("dataDomains", JoinType.INNER);
                predicates.add(ddJoin.get("id").in(criteria.dataDomainIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.typeIds())) {
                predicates.add(root.get("type").get("id").in(criteria.typeIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.transportLayerIds())) {
                predicates.add(root.get("transportLayer").get("id").in(criteria.transportLayerIds()));
            }

            if (!CollectionUtils.isEmpty(criteria.statusIds())) {
                predicates.add(root.get("status").get("id").in(criteria.statusIds()));
            }

            if (StringUtils.hasText(criteria.apiQuery())) {
                String pattern = "%" + criteria.apiQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("code")), pattern)
                ));
            }

            if (StringUtils.hasText(criteria.systemNameQuery())) {
                String sysPattern = "%" + criteria.systemNameQuery().toLowerCase() + "%";
                Join<ApiEntity, ItSystemEntity> producerJoin = root.join("producerSystem", JoinType.LEFT);
                Join<ApiEntity, ItSystemEntity> consumerJoin2 = root.join("consumerSystems", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(producerJoin.get("name")), sysPattern),
                        cb.like(cb.lower(consumerJoin2.get("name")), sysPattern)
                ));
                query.distinct(true);
            }

            if (!CollectionUtils.isEmpty(criteria.apiTags())) {
                HibernateCriteriaBuilder hcb = (HibernateCriteriaBuilder) cb;
                JpaRoot<ApiEntity> jpaRoot = (JpaRoot<ApiEntity>) root;
                List<Predicate> tagPredicates = criteria.apiTags().stream()
                        .map(tag -> (Predicate) hcb.like(
                                cb.lower(hcb.cast(jpaRoot.get("tags"), String.class)),
                                "%\"" + tag.toLowerCase() + "\"%"
                        ))
                        .toList();
                predicates.add(cb.or(tagPredicates.toArray(new Predicate[0])));
            }

            if (StringUtils.hasText(criteria.dataDomainQuery())) {
                String ddPattern = "%" + criteria.dataDomainQuery().toLowerCase() + "%";
                Join<ApiEntity, Object> ddJoin = root.join("dataDomains", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(ddJoin.get("name")), ddPattern),
                        cb.like(cb.lower(ddJoin.get("code")), ddPattern)
                ));
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ApiGraphSystemDto toSystemDto(ItSystemEntity system) {
        return new ApiGraphSystemDto(
                system.getId(),
                system.getCode(),
                system.getName(),
                system.getDescription(),
                system.getIcon(),
                mapEntry(system.getStatus()),
                mapEntry(system.getSystemType()),
                mapEntry(system.getLifecycleStage()),
                mapEntry(system.getBusinessCriticality()),
                mapEntry(system.getDataClassification()),
                mapEntry(system.getArchitectureStyle()),
                system.isActive()
        );
    }

    private ApiGraphEdgeDto toEdgeDto(ApiEntity api) {
        List<UUID> consumerSystemIds = api.getConsumerSystems().stream()
                .map(ItSystemEntity::getId)
                .toList();
        List<String> dataDomainNames = api.getDataDomains().stream()
                .filter(DataDomainEntity::isActive)
                .map(DataDomainEntity::getName)
                .toList();
        List<String> environmentNames = api.getEnvironments().stream()
                .map(e -> e.getEnvironment().getName())
                .toList();
        return new ApiGraphEdgeDto(
                api.getId(),
                api.getCode(),
                api.getName(),
                api.getApiVersion(),
                mapEntry(api.getType()),
                mapEntry(api.getStatus()),
                mapTransportLayer(api.getTransportLayer()),
                mapEntry(api.getProtocol()),
                mapEntry(api.getAuthenticationMethod()),
                mapEntry(api.getDataFlowDirection()),
                api.getProducerSystem() != null ? api.getProducerSystem().getId() : null,
                consumerSystemIds,
                api.getTags(),
                dataDomainNames,
                environmentNames,
                api.isActive()
        );
    }

    private DictionaryEntryRefDto mapEntry(DictionaryEntryEntity entry) {
        if (entry == null) return null;
        return new DictionaryEntryRefDto(entry.getId(), entry.getCode(), entry.getName());
    }

    private TransportLayerRefDto mapTransportLayer(TransportLayerEntity tl) {
        if (tl == null) return null;
        return new TransportLayerRefDto(tl.getId(), tl.getCode(), tl.getName(), tl.getIcon(), tl.getColor());
    }
}
