package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;

import java.time.LocalDate;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaRoot;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class ApiSpecification implements Specification<ApiEntity> {

    private final ApiSearchCriteria criteria;
    private final String currentUserEmail;
    private final Set<UUID> verifiableSystemIds;

    public ApiSpecification(ApiSearchCriteria criteria, String currentUserEmail, Set<UUID> verifiableSystemIds) {
        this.criteria = criteria;
        this.currentUserEmail = currentUserEmail;
        this.verifiableSystemIds = verifiableSystemIds != null ? verifiableSystemIds : Collections.emptySet();
    }

    @Override
    public Predicate toPredicate(@NonNull Root<ApiEntity> root, @NonNull CriteriaQuery<?> query, @NonNull CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();

        // ── Governance visibility filter ──────────────────────────────────────
        // VERIFIED and PENDING_REVIEW are always public.
        // PENDING_VERIFICATION and REQUIRES_MODIFICATION are visible only to
        // the creator or to verifiers of the producer system.
        Predicate isPublic = root.get("governanceStatus").in(
                GovernanceStatus.VERIFIED, GovernanceStatus.PENDING_REVIEW);
        Predicate isCreator = cb.equal(root.get("createdBy"), currentUserEmail);

        if (verifiableSystemIds.isEmpty()) {
            predicates.add(cb.or(isPublic, isCreator));
        } else {
            Predicate isVerifier = root.get("producerSystem").get("id").in(verifiableSystemIds);
            predicates.add(cb.or(isPublic, isCreator, isVerifier));
        }

        // ── Standard search filters ───────────────────────────────────────────
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

        if (criteria.producerSystemIds() != null && !criteria.producerSystemIds().isEmpty()) {
            predicates.add(root.get("producerSystem").get("id").in(criteria.producerSystemIds()));
        }

        if (criteria.consumerSystemIds() != null && !criteria.consumerSystemIds().isEmpty()) {
            query.distinct(true);
            Join<Object, Object> consumerJoin = root.join("consumerSystems", JoinType.INNER);
            predicates.add(consumerJoin.get("id").in(criteria.consumerSystemIds()));
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
            predicates.add(cb.equal(envJoin.get("environment").get("id"), criteria.environmentId()));
        }

        if (StringUtils.hasText(criteria.description())) {
            String pattern = "%" + criteria.description().toLowerCase() + "%";
            predicates.add(cb.like(cb.lower(root.get("description")), pattern));
        }

        if (criteria.integrationPatternId() != null) {
            predicates.add(cb.equal(root.get("integrationPattern").get("id"), criteria.integrationPatternId()));
        }

        if (criteria.dataDomainIds() != null && !criteria.dataDomainIds().isEmpty()) {
            query.distinct(true);
            Join<Object, Object> ddJoin = root.join("dataDomains", JoinType.INNER);
            predicates.add(ddJoin.get("id").in(criteria.dataDomainIds()));
        }

        if (StringUtils.hasText(criteria.attachmentContent())) {
            Subquery<Integer> sub = query.subquery(Integer.class);
            Root<ApiAttachmentEntity> att = sub.from(ApiAttachmentEntity.class);
            sub.select(cb.literal(1));
            // safe_convert_from returns NULL instead of throwing on invalid byte sequences
            // (e.g. binary files like PNG/PDF stored alongside text contracts)
            Expression<String> contentText = cb.function(
                    "atlas.safe_convert_from", String.class,
                    att.get("content"), cb.literal("UTF8")
            );
            String attachmentPattern = "%" + criteria.attachmentContent().toLowerCase() + "%";
            sub.where(cb.and(
                    cb.equal(att.get("api"), root),
                    cb.like(cb.lower(contentText), attachmentPattern)
            ));
            predicates.add(cb.exists(sub));
        }

        if (StringUtils.hasText(criteria.ownerName())) {
            query.distinct(true);
            Join<ApiEntity, ApiOwnerEntity> ownerJoin = root.join("owners", JoinType.INNER);
            String ownerPattern = "%" + criteria.ownerName().toLowerCase() + "%";
            Expression<String> fullName = cb.concat(
                    cb.concat(cb.lower(ownerJoin.get("firstName")), cb.literal(" ")),
                    cb.lower(ownerJoin.get("lastName"))
            );
            Predicate nameMatch = cb.or(
                    cb.like(cb.lower(ownerJoin.get("firstName")), ownerPattern),
                    cb.like(cb.lower(ownerJoin.get("lastName")), ownerPattern),
                    cb.like(fullName, ownerPattern)
            );
            Predicate isCurrentOwner = cb.or(
                    cb.isNull(ownerJoin.get("validTo")),
                    cb.greaterThanOrEqualTo(ownerJoin.<LocalDate>get("validTo"), LocalDate.now())
            );
            predicates.add(cb.and(nameMatch, isCurrentOwner));
        }

        if (Boolean.TRUE.equals(criteria.pendingVerificationOnly())) {
            predicates.add(root.get("governanceStatus").in(
                    GovernanceStatus.PENDING_VERIFICATION, GovernanceStatus.PENDING_REVIEW));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    }
}
