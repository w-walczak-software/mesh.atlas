package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaRoot;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;

import java.util.ArrayList;
import java.util.List;

public class ApiSpecification implements Specification<ApiEntity> {

    private final ApiSearchCriteria criteria;

    public ApiSpecification(ApiSearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(@NonNull Root<ApiEntity> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        if (StringUtils.hasText(criteria.query())) {
            String pattern = "%" + criteria.query().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
            ));
        }

        if (criteria.statusId() != null) {
            predicates.add(cb.equal(root.get("status").get("id"), criteria.statusId()));
        }

        if (criteria.typeId() != null) {
            predicates.add(cb.equal(root.get("type").get("id"), criteria.typeId()));
        }

        if (criteria.transportLayerId() != null) {
            predicates.add(cb.equal(root.get("transportLayer").get("id"), criteria.transportLayerId()));
        }

        if (criteria.sourceSystemId() != null) {
            predicates.add(cb.equal(root.get("sourceSystem").get("id"), criteria.sourceSystemId()));
        }

        if (criteria.targetSystemId() != null) {
            predicates.add(cb.equal(root.get("targetSystem").get("id"), criteria.targetSystemId()));
        }

        if (criteria.active() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.active()));
        }

        if (StringUtils.hasText(criteria.tag())) {
            HibernateCriteriaBuilder hcb = (HibernateCriteriaBuilder) cb;
            JpaRoot<ApiEntity> jpaRoot = (JpaRoot<ApiEntity>) root;
            predicates.add(hcb.like(
                    cb.lower(hcb.cast(jpaRoot.get("tags"), String.class)),
                    "%\"" + criteria.tag().toLowerCase() + "\"%"
            ));
        }

        if (criteria.environmentId() != null) {
            query.distinct(true);
            Join<Object, Object> envJoin = root.join("environments", JoinType.INNER);
            predicates.add(cb.equal(envJoin.get("id"), criteria.environmentId()));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
