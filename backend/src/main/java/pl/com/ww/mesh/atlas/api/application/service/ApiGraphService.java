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
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiGraphService {

    private final ApiRepository apiRepository;

    public ApiGraphResultDto findForGraph(ApiGraphSearchCriteria criteria) {
        List<ApiEntity> apis = apiRepository.findAll(buildSpec(criteria));

        Map<UUID, ApiGraphSystemDto> systemMap = new LinkedHashMap<>();
        List<ApiGraphEdgeDto> edges = new ArrayList<>();

        for (ApiEntity api : apis) {
            if (!api.isActive()) continue;

            ItSystemEntity source = api.getSourceSystem();
            ItSystemEntity target = api.getTargetSystem();

            if (source != null) {
                systemMap.putIfAbsent(source.getId(), toSystemDto(source));
            }
            if (target != null) {
                systemMap.putIfAbsent(target.getId(), toSystemDto(target));
            }

            edges.add(toEdgeDto(api));
        }

        return new ApiGraphResultDto(new ArrayList<>(systemMap.values()), edges);
    }

    private Specification<ApiEntity> buildSpec(ApiGraphSearchCriteria criteria) {
        return (Root<ApiEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter active only for graph
            predicates.add(cb.equal(root.get("active"), true));

            if (!CollectionUtils.isEmpty(criteria.systemIds())) {
                Predicate sourceIn = root.get("sourceSystem").get("id").in(criteria.systemIds());
                Predicate targetIn = root.get("targetSystem").get("id").in(criteria.systemIds());
                predicates.add(cb.or(sourceIn, targetIn));
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
                Join<ApiEntity, ItSystemEntity> sourceJoin = root.join("sourceSystem", JoinType.LEFT);
                Join<ApiEntity, ItSystemEntity> targetJoin = root.join("targetSystem", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(sourceJoin.get("name")), sysPattern),
                        cb.like(cb.lower(targetJoin.get("name")), sysPattern)
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
                system.isActive()
        );
    }

    private ApiGraphEdgeDto toEdgeDto(ApiEntity api) {
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
                api.getSourceSystem() != null ? api.getSourceSystem().getId() : null,
                api.getTargetSystem() != null ? api.getTargetSystem().getId() : null,
                api.getTags(),
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
