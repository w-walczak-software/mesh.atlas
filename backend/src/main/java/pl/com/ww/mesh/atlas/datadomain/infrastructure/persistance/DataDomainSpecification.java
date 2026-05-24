package pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaRoot;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSearchCriteria;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;

import java.util.ArrayList;
import java.util.List;

public class DataDomainSpecification implements Specification<DataDomainEntity> {

    private final DataDomainSearchCriteria criteria;

    public DataDomainSpecification(DataDomainSearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(@NonNull Root<DataDomainEntity> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        if (StringUtils.hasText(criteria.query())) {
            String pattern = "%" + criteria.query().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern)
            ));
        }

        if (criteria.active() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.active()));
        }

        if (StringUtils.hasText(criteria.tag())) {
            HibernateCriteriaBuilder hcb = (HibernateCriteriaBuilder) cb;
            JpaRoot<DataDomainEntity> jpaRoot = (JpaRoot<DataDomainEntity>) root;
            predicates.add(hcb.like(
                    cb.lower(hcb.cast(jpaRoot.get("tags"), String.class)),
                    "%\"" + criteria.tag().toLowerCase() + "\"%"
            ));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
