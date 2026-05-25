package pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSearchCriteria;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.util.ArrayList;
import java.util.List;

public class TransportLayerSpecification implements Specification<TransportLayerEntity> {

    private final TransportLayerSearchCriteria criteria;

    public TransportLayerSpecification(TransportLayerSearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    public Predicate toPredicate(@NonNull Root<TransportLayerEntity> root,
                                 @NonNull CriteriaQuery<?> query,
                                 @NonNull CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        if (criteria.query() != null && !criteria.query().isBlank()) {
            String pattern = "%" + criteria.query().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern)
            ));
        }

        if (criteria.active() != null) {
            predicates.add(cb.equal(root.get("active"), criteria.active()));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
