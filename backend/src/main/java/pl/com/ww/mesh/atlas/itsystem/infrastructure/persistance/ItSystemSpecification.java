package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemSearchCriteria;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;

import java.util.ArrayList;
import java.util.List;

public class ItSystemSpecification implements Specification<ItSystemEntity> {

    private final ItSystemSearchCriteria criteria;

    public ItSystemSpecification(ItSystemSearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(@NonNull Root<ItSystemEntity> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        if (StringUtils.hasText(criteria.query())) {
            String pattern = "%" + criteria.query().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern)
            ));
        }

        if (criteria.statusId() != null) {
            predicates.add(cb.equal(root.get("status").get("id"), criteria.statusId()));
        }
        if (criteria.lifecycleStageId() != null) {
            predicates.add(cb.equal(root.get("lifecycleStage").get("id"), criteria.lifecycleStageId()));
        }
        if (criteria.businessCriticalityId() != null) {
            predicates.add(cb.equal(root.get("businessCriticality").get("id"), criteria.businessCriticalityId()));
        }
        if (criteria.systemTypeId() != null) {
            predicates.add(cb.equal(root.get("systemType").get("id"), criteria.systemTypeId()));
        }
        if (criteria.active() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.active()));
        }

        if (StringUtils.hasText(criteria.ownerQuery())) {
            Join<Object, Object> owners = root.join("owners", JoinType.LEFT);
            String ownerPattern = "%" + criteria.ownerQuery().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(owners.get("firstName")), ownerPattern),
                    cb.like(cb.lower(owners.get("lastName")), ownerPattern),
                    cb.like(cb.lower(owners.get("email")), ownerPattern)
            ));
            query.distinct(true);
        }

        if (!Long.class.equals(query.getResultType())) {
            root.fetch("status", JoinType.INNER);
            root.fetch("lifecycleStage", JoinType.INNER);
            root.fetch("businessCriticality", JoinType.INNER);
            root.fetch("systemType", JoinType.INNER);
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
