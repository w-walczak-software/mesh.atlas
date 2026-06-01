package pl.com.ww.mesh.atlas.audit.application.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.audit.application.dto.AuditLogEntryDto;
import pl.com.ww.mesh.atlas.audit.application.dto.AuditLogSearchRequest;
import pl.com.ww.mesh.atlas.audit.application.mapper.AuditLogMapper;
import pl.com.ww.mesh.atlas.audit.domain.event.AuditEvent;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditLogEntry;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditOutcome;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.audit.infrastructure.persistence.AuditLogRepository;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;
    private final AuditLogMapper mapper;

    /**
     * Async, isolated-transaction listener: audit writes never affect the calling transaction
     * and persist independently of the outcome of the main business operation.
     * Actor info is embedded in AuditEvent (captured on the calling thread) so ThreadLocal
     * UserContextHolder is not accessed here.
     */
    @Async("auditTaskExecutor")
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAuditEvent(AuditEvent event) {
        try {
            AuditLogEntry entry = AuditLogEntry.builder()
                    .eventTime(OffsetDateTime.now(ZoneOffset.UTC))
                    .category(event.category())
                    .action(event.action())
                    .resourceType(event.resourceType())
                    .resourceId(event.resourceId())
                    .resourceName(event.resourceName())
                    .actorId(event.actorId())
                    .actorUsername(event.actorUsername() != null ? event.actorUsername() : "system")
                    .actorEmail(event.actorEmail())
                    .outcome(event.outcome())
                    .severity(event.severity())
                    .message(event.message())
                    .context(event.context())
                    .errorDetail(event.errorDetail())
                    .build();
            repository.save(entry);
        } catch (Exception ex) {
            log.error("Failed to persist audit log entry: action={}, resource={}, actor={}",
                    event.action(), event.resourceType(), event.actorUsername(), ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntryDto> search(AuditLogSearchRequest filter, Pageable pageable) {
        return repository.findAll(buildSpec(filter), pageable).map(mapper::toDto);
    }

    private Specification<AuditLogEntry> buildSpec(AuditLogSearchRequest f) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (f.actorUsername() != null && !f.actorUsername().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("actorUsername")),
                        "%" + f.actorUsername().trim().toLowerCase() + "%"));
            }
            if (f.category() != null && !f.category().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("category"),
                            AuditCategory.valueOf(f.category().trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }
            if (f.action() != null && !f.action().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("action"),
                            AuditAction.valueOf(f.action().trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }
            if (f.resourceType() != null && !f.resourceType().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("resourceType"),
                            AuditResourceType.valueOf(f.resourceType().trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }
            if (f.outcome() != null && !f.outcome().isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("outcome"),
                            AuditOutcome.valueOf(f.outcome().trim().toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }
            if (f.startDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("eventTime"),
                        f.startDate().atOffset(ZoneOffset.UTC)));
            }
            if (f.endDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("eventTime"),
                        f.endDate().atOffset(ZoneOffset.UTC)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
