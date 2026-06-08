package pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSearchCriteria;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RequiredArgsConstructor
public class ChangeRequestSpecification implements Specification<ChangeRequestEntity> {

    private final ChangeRequestSearchCriteria criteria;
    /** null = admin (no restriction); otherwise APIs the user has any ownership role on. */
    private final Set<UUID> ownedApiIds;
    /** null = admin (no restriction); otherwise also include CRs where user is requester. */
    private final String currentUserEmail;

    @Override
    public Predicate toPredicate(Root<ChangeRequestEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        predicates.add(cb.isTrue(root.get("active")));

        if (ownedApiIds != null || currentUserEmail != null) {
            List<Predicate> visible = new ArrayList<>();
            if (ownedApiIds != null && !ownedApiIds.isEmpty()) {
                visible.add(root.get("api").get("id").in(ownedApiIds));
            }
            if (currentUserEmail != null) {
                visible.add(cb.equal(cb.lower(root.get("requesterEmail")), currentUserEmail.toLowerCase()));
            }
            if (visible.isEmpty()) {
                return cb.disjunction();
            }
            predicates.add(cb.or(visible.toArray(new Predicate[0])));
        }

        if (criteria.apiId() != null) {
            predicates.add(cb.equal(root.get("api").get("id"), criteria.apiId()));
        }
        if (criteria.status() != null) {
            predicates.add(cb.equal(root.get("status"), criteria.status()));
        }
        if (criteria.changeTypeId() != null) {
            predicates.add(cb.equal(root.get("changeType").get("id"), criteria.changeTypeId()));
        }
        if (criteria.priorityId() != null) {
            predicates.add(cb.equal(root.get("priority").get("id"), criteria.priorityId()));
        }
        if (criteria.requesterEmail() != null && !criteria.requesterEmail().isBlank()) {
            predicates.add(cb.like(
                    cb.lower(root.get("requesterEmail")),
                    "%" + criteria.requesterEmail().toLowerCase() + "%"));
        }
        if (criteria.fromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.fromDate().atStartOfDay()));
        }
        if (criteria.toDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.toDate().atTime(23, 59, 59)));
        }
        if (criteria.searchText() != null && !criteria.searchText().isBlank()) {
            String pattern = "%" + criteria.searchText().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("requesterName")), pattern),
                    cb.like(cb.lower(root.get("requesterEmail")), pattern)
            ));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
