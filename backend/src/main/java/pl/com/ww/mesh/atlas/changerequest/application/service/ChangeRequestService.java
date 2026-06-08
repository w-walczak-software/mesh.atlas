package pl.com.ww.mesh.atlas.changerequest.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestReviewRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSearchCriteria;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSubmitRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSummaryDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.MarkImplementedRequest;
import pl.com.ww.mesh.atlas.changerequest.application.mapper.ChangeRequestMapper;
import pl.com.ww.mesh.atlas.changerequest.domain.exception.ChangeRequestNotFoundException;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestReviewEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;
import pl.com.ww.mesh.atlas.changerequest.domain.model.RequesterType;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewDecision;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewerRole;
import pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence.ChangeRequestRepository;
import pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence.ChangeRequestReviewRepository;
import pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence.ChangeRequestSpecification;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateProcessingService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasAccessForbiddenException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChangeRequestService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ChangeRequestRepository repository;
    private final ChangeRequestReviewRepository reviewRepository;
    private final ApiRepository apiRepository;
    private final ApiOwnerRepository ownerRepository;
    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final ChangeRequestMapper mapper;
    private final UserContextService userContextService;
    private final EmailTemplateProcessingService templateProcessing;
    private final EmailService emailService;

    public ChangeRequestDto submit(ChangeRequestSubmitRequest request) {
        var user = userContextService.getCurrentUser();
        var api = apiRepository.findById(request.apiId())
                .orElseThrow(() -> new AtlasApiNotFoundException(request.apiId().toString()));
        var changeType = dictionaryEntryRepository.findById(request.changeTypeId())
                .orElseThrow(() -> new AtlasException("Change type not found", "dict.entry.not.found", request.changeTypeId().toString()));
        var priority = dictionaryEntryRepository.findById(request.priorityId())
                .orElseThrow(() -> new AtlasException("Priority not found", "dict.entry.not.found", request.priorityId().toString()));

        String requesterName = buildFullName(user);

        var entity = ChangeRequestEntity.builder()
                .api(api)
                .title(request.title())
                .description(request.description())
                .changeType(changeType)
                .priority(priority)
                .status(ChangeRequestStatus.SUBMITTED)
                .requesterType(RequesterType.INTERNAL)
                .requesterUserId(user.id())
                .requesterEmail(user.email())
                .requesterName(requesterName)
                .active(true)
                .build();

        var saved = repository.save(entity);
        sendSubmittedNotification(saved);
        return mapper.map(saved);
    }

    public ChangeRequestDto review(UUID id, ChangeRequestReviewRequest request) {
        var user = userContextService.getCurrentUser();
        var entity = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ChangeRequestNotFoundException(id));

        if (!entity.getStatus().allowsReview()) {
            throw new AtlasException(
                    "Change request cannot be reviewed in status " + entity.getStatus(),
                    "change.request.invalid.status",
                    entity.getStatus().name());
        }

        assertReviewerPermission(user, entity.getApi());

        ReviewerRole role = resolveReviewerRole(user, entity.getApi());

        entity.setStatus(mapDecisionToStatus(request.decision()));
        if (request.plannedImplementationDate() != null) {
            entity.setPlannedImplementationDate(request.plannedImplementationDate());
        }
        if (request.plannedVersion() != null && !request.plannedVersion().isBlank()) {
            entity.setPlannedVersion(request.plannedVersion());
        }

        var review = ChangeRequestReviewEntity.builder()
                .changeRequest(entity)
                .reviewerRole(role)
                .reviewerId(user.id())
                .reviewerName(buildFullName(user))
                .reviewerEmail(user.email())
                .decision(request.decision())
                .comment(request.comment())
                .reviewedAt(LocalDateTime.now())
                .build();

        reviewRepository.save(review);
        var saved = repository.save(entity);
        sendStatusChangedNotification(saved, review);
        return mapper.map(saved);
    }

    public ChangeRequestDto markImplemented(UUID id, MarkImplementedRequest request) {
        var user = userContextService.getCurrentUser();
        var entity = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ChangeRequestNotFoundException(id));

        if (entity.getStatus() != ChangeRequestStatus.APPROVED) {
            throw new AtlasException(
                    "Only APPROVED change requests can be marked as implemented",
                    "change.request.invalid.status",
                    entity.getStatus().name());
        }

        assertReviewerPermission(user, entity.getApi());

        entity.setStatus(ChangeRequestStatus.IMPLEMENTED);
        entity.setImplementedAt(LocalDateTime.now());
        entity.setImplementedVersion(request.implementedVersion());

        var review = ChangeRequestReviewEntity.builder()
                .changeRequest(entity)
                .reviewerRole(resolveReviewerRole(user, entity.getApi()))
                .reviewerId(user.id())
                .reviewerName(buildFullName(user))
                .reviewerEmail(user.email())
                .decision(ReviewDecision.APPROVED)
                .comment(request.note())
                .reviewedAt(LocalDateTime.now())
                .build();

        reviewRepository.save(review);
        var saved = repository.save(entity);
        sendStatusChangedNotification(saved, review);
        return mapper.map(saved);
    }

    public void cancel(UUID id) {
        var user = userContextService.getCurrentUser();
        var entity = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ChangeRequestNotFoundException(id));

        if (entity.getStatus().isTerminal()) {
            throw new AtlasException(
                    "Change request is already in a terminal status",
                    "change.request.invalid.status",
                    entity.getStatus().name());
        }

        if (!ownerRepository.existsActiveApiEditOwner(user.email(), entity.getApi().getId())) {
            throw new AtlasAccessForbiddenException("Only API owners can cancel a change request");
        }

        entity.setStatus(ChangeRequestStatus.CANCELLED);
        entity.setActive(false);
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<ChangeRequestSummaryDto> findAll(ChangeRequestSearchCriteria criteria, Pageable pageable) {
        var user = userContextService.getCurrentUser();
        Set<UUID> ownedApiIds   = user.isPrivileged() ? null : ownerRepository.findActiveOwnedApiIds(user.email());
        Set<UUID> editableApiIds = ownerRepository.findEditableApiIdsByEmail(user.email());
        String    currentEmail  = user.isPrivileged() ? null : user.email();
        var spec = new ChangeRequestSpecification(criteria, ownedApiIds, currentEmail);
        return repository.findAll(spec, pageable)
                .map(entity -> mapper.mapSummary(entity,
                        editableApiIds.contains(entity.getApi().getId()),
                        entity.getRequesterEmail().equalsIgnoreCase(user.email())));
    }

    @Transactional(readOnly = true)
    public ChangeRequestDto findById(UUID id) {
        var user = userContextService.getCurrentUser();
        var entity = repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ChangeRequestNotFoundException(id));

        boolean isRequester = user.id() != null && user.id().equals(entity.getRequesterUserId())
                || user.email().equalsIgnoreCase(entity.getRequesterEmail());
        boolean isOwner = ownerRepository.existsActiveApiEditOwner(user.email(), entity.getApi().getId());
        if (!isRequester && !isOwner && !user.isPrivileged()) {
            throw new AtlasAccessForbiddenException("Access denied to change request " + id);
        }

        return mapper.map(entity);
    }

    @Transactional(readOnly = true)
    public Page<ChangeRequestSummaryDto> findByApi(UUID apiId, Pageable pageable) {
        var user = userContextService.getCurrentUser();
        if (!user.isPrivileged() && !ownerRepository.existsActiveApiEditOwner(user.email(), apiId)) {
            throw new AtlasAccessForbiddenException("Access denied to change requests for API " + apiId);
        }
        Set<UUID> editableApiIds = ownerRepository.findEditableApiIdsByEmail(user.email());
        return repository.findByApiIdAndActiveTrue(apiId, pageable)
                .map(entity -> mapper.mapSummary(entity,
                        editableApiIds.contains(entity.getApi().getId()),
                        entity.getRequesterEmail().equalsIgnoreCase(user.email())));
    }

    @Transactional(readOnly = true)
    public Page<ChangeRequestSummaryDto> findMine(Pageable pageable) {
        var user = userContextService.getCurrentUser();
        Set<UUID> editableApiIds = ownerRepository.findEditableApiIdsByEmail(user.email());
        var criteria = new ChangeRequestSearchCriteria(null, null, null, null, user.email(), null, null, null);
        var spec = new ChangeRequestSpecification(criteria, null, null);
        return repository.findAll(spec, pageable)
                .map(entity -> mapper.mapSummary(entity,
                        editableApiIds.contains(entity.getApi().getId()),
                        true));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void assertReviewerPermission(AuthenticatedUser user, ApiEntity api) {
        if (!ownerRepository.existsActiveApiEditOwner(user.email(), api.getId())) {
            throw new AtlasAccessForbiddenException("Only API owners can review change requests");
        }
    }

    private ReviewerRole resolveReviewerRole(AuthenticatedUser user, ApiEntity api) {
        List<ApiOwnerEntity> ownership = activeOwnershipForUser(user.email(), api.getId());
        boolean isTechnical = ownership.stream().anyMatch(o -> "TECHNICAL_OWNER".equals(o.getRole().getCode()));
        if (isTechnical) return ReviewerRole.TECHNICAL_OWNER;
        boolean isBusiness = ownership.stream().anyMatch(o -> "BUSINESS_OWNER".equals(o.getRole().getCode()));
        if (isBusiness) return ReviewerRole.BUSINESS_OWNER;
        return ReviewerRole.ADMIN;
    }

    private List<ApiOwnerEntity> activeOwnershipForUser(String email, UUID apiId) {
        return ownerRepository.findByApiId(apiId).stream()
                .filter(o -> o.getEmail().equalsIgnoreCase(email))
                .filter(o -> o.getValidTo() == null || !o.getValidTo().isBefore(LocalDate.now()))
                .toList();
    }

    private ChangeRequestStatus mapDecisionToStatus(ReviewDecision decision) {
        return switch (decision) {
            case APPROVED -> ChangeRequestStatus.APPROVED;
            case REJECTED -> ChangeRequestStatus.REJECTED;
            case DEFERRED -> ChangeRequestStatus.DEFERRED;
            case NEEDS_CLARIFICATION -> ChangeRequestStatus.UNDER_REVIEW;
        };
    }

    private String buildFullName(AuthenticatedUser user) {
        if (user.firstName() != null && user.lastName() != null) {
            return (user.firstName() + " " + user.lastName()).trim();
        }
        if (user.firstName() != null) return user.firstName();
        return user.email();
    }

    private void sendSubmittedNotification(ChangeRequestEntity cr) {
        try {
            List<String> recipientEmails = ownerRepository.findByApiId(cr.getApi().getId()).stream()
                    .filter(o -> o.getValidTo() == null || !o.getValidTo().isBefore(LocalDate.now()))
                    .map(ApiOwnerEntity::getEmail)
                    .distinct()
                    .toList();

            if (recipientEmails.isEmpty()) {
                log.warn("No active owners for API {} — skipping change request notification", cr.getApi().getCode());
                return;
            }

            Map<String, Object> vars = buildSubmittedVars(cr);
            String body = templateProcessing.processByCode("CHANGE_REQUEST_SUBMITTED", vars);
            String subject = "Nowe żądanie zmiany API: " + cr.getApi().getName();
            for (String email : recipientEmails) {
                emailService.sendEmail(email, subject, body, false);
            }
        } catch (Exception e) {
            log.error("Failed to send CHANGE_REQUEST_SUBMITTED notification for CR {}", cr.getId(), e);
        }
    }

    private void sendStatusChangedNotification(ChangeRequestEntity cr, ChangeRequestReviewEntity review) {
        try {
            Map<String, Object> vars = buildStatusChangedVars(cr, review);
            String body = templateProcessing.processByCode("CHANGE_REQUEST_STATUS_CHANGED", vars);
            String subject = "Aktualizacja żądania zmiany API: " + cr.getApi().getName();
            emailService.sendEmail(cr.getRequesterEmail(), subject, body, false);
        } catch (Exception e) {
            log.error("Failed to send CHANGE_REQUEST_STATUS_CHANGED notification for CR {}", cr.getId(), e);
        }
    }

    private Map<String, Object> buildSubmittedVars(ChangeRequestEntity cr) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("apiName", cr.getApi().getName());
        vars.put("apiCode", cr.getApi().getCode());
        vars.put("apiVersion", cr.getApi().getApiVersion());
        vars.put("requesterName", cr.getRequesterName() != null ? cr.getRequesterName() : cr.getRequesterEmail());
        vars.put("requesterEmail", cr.getRequesterEmail());
        vars.put("crTitle", cr.getTitle());
        vars.put("crDescription", cr.getDescription());
        vars.put("changeType", cr.getChangeType().getName());
        vars.put("priority", cr.getPriority().getName());
        vars.put("submittedAt", cr.getCreatedAt() != null ? cr.getCreatedAt().format(DATE_FMT) : "");
        vars.put("crId", cr.getId().toString());
        return vars;
    }

    private Map<String, Object> buildStatusChangedVars(ChangeRequestEntity cr, ChangeRequestReviewEntity review) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("requesterName", cr.getRequesterName() != null ? cr.getRequesterName() : cr.getRequesterEmail());
        vars.put("apiName", cr.getApi().getName());
        vars.put("apiCode", cr.getApi().getCode());
        vars.put("crTitle", cr.getTitle());
        vars.put("newStatus", cr.getStatus().name());
        vars.put("statusLabel", resolveStatusLabel(cr.getStatus()));
        vars.put("headerClass", resolveHeaderClass(cr.getStatus()));
        vars.put("reviewerName", review.getReviewerName() != null ? review.getReviewerName() : review.getReviewerEmail());
        vars.put("reviewerRole", resolveRoleLabel(review.getReviewerRole()));
        vars.put("comment", review.getComment());
        vars.put("plannedDate", cr.getPlannedImplementationDate() != null ? cr.getPlannedImplementationDate().toString() : null);
        vars.put("plannedVersion", cr.getPlannedVersion());
        vars.put("reviewedAt", review.getReviewedAt().format(DATE_FMT));
        return vars;
    }

    private String resolveStatusLabel(ChangeRequestStatus status) {
        return switch (status) {
            case SUBMITTED -> "Złożone";
            case UNDER_REVIEW -> "W trakcie przeglądu";
            case APPROVED -> "Zatwierdzone";
            case REJECTED -> "Odrzucone";
            case DEFERRED -> "Odroczone";
            case IMPLEMENTED -> "Wdrożone";
            case CANCELLED -> "Anulowane";
        };
    }

    private String resolveHeaderClass(ChangeRequestStatus status) {
        return switch (status) {
            case APPROVED, IMPLEMENTED -> "approved";
            case REJECTED -> "rejected";
            case DEFERRED -> "deferred";
            case UNDER_REVIEW, SUBMITTED -> "review";
            default -> "other";
        };
    }

    private String resolveRoleLabel(ReviewerRole role) {
        return switch (role) {
            case TECHNICAL_OWNER -> "Właściciel techniczny";
            case BUSINESS_OWNER -> "Właściciel biznesowy";
            case ADMIN -> "Administrator";
        };
    }
}
