package pl.com.ww.mesh.atlas.changerequest.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestReviewRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSubmitRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.MarkImplementedRequest;
import pl.com.ww.mesh.atlas.changerequest.application.mapper.ChangeRequestMapper;
import pl.com.ww.mesh.atlas.changerequest.domain.exception.ChangeRequestNotFoundException;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestReviewEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewDecision;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ReviewerRole;
import pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence.ChangeRequestRepository;
import pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence.ChangeRequestReviewRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.email.application.service.EmailTemplateProcessingService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasAccessForbiddenException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChangeRequestServiceTest {

    @Mock private ChangeRequestRepository repository;
    @Mock private ChangeRequestReviewRepository reviewRepository;
    @Mock private ApiRepository apiRepository;
    @Mock private ApiOwnerRepository ownerRepository;
    @Mock private DictionaryEntryRepository dictionaryEntryRepository;
    @Mock private ChangeRequestMapper mapper;
    @Mock private UserContextService userContextService;
    @Mock private EmailTemplateProcessingService templateProcessing;
    @Mock private EmailService emailService;

    @InjectMocks
    private ChangeRequestService service;

    // ── submit ────────────────────────────────────────────────────────────────

    @Test
    void submit_validRequest_createsCrWithSubmittedStatus() {
        UUID apiId = UUID.randomUUID();
        UUID changeTypeId = UUID.randomUUID();
        UUID priorityId = UUID.randomUUID();
        var request = new ChangeRequestSubmitRequest(apiId, "Upgrade version", "Details", changeTypeId, priorityId);

        var api = apiWithId(apiId, "MY-API");
        var changeType = entryWithCode("MAJOR_VERSION");
        var priority = entryWithCode("HIGH");
        var user = regularUser("anna@test.pl");
        var stubDto = stubChangeRequestDto();

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(api));
        when(dictionaryEntryRepository.findById(changeTypeId)).thenReturn(Optional.of(changeType));
        when(dictionaryEntryRepository.findById(priorityId)).thenReturn(Optional.of(priority));
        when(repository.save(any(ChangeRequestEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.map(any(ChangeRequestEntity.class))).thenReturn(stubDto);
        // empty owner list → notification sends no email (early return in sendSubmittedNotification)
        when(ownerRepository.findByApiId(apiId)).thenReturn(List.of());

        service.submit(request);

        ArgumentCaptor<ChangeRequestEntity> captor = ArgumentCaptor.forClass(ChangeRequestEntity.class);
        verify(repository).save(captor.capture());
        ChangeRequestEntity saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(ChangeRequestStatus.SUBMITTED);
        assertThat(saved.getRequesterEmail()).isEqualTo("anna@test.pl");
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void submit_apiNotFound_throwsNotFoundException() {
        UUID apiId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(regularUser("u@test.pl"));
        when(apiRepository.findById(apiId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submit(
                new ChangeRequestSubmitRequest(apiId, "T", "D", UUID.randomUUID(), UUID.randomUUID())))
                .isInstanceOf(AtlasApiNotFoundException.class);
    }

    @Test
    void submit_emailServiceThrows_doesNotPropagateException() {
        UUID apiId = UUID.randomUUID();
        UUID changeTypeId = UUID.randomUUID();
        UUID priorityId = UUID.randomUUID();

        var api = apiWithId(apiId, "MY-API");
        var changeType = entryWithCode("MAJOR");
        var priority = entryWithCode("HIGH");
        var user = regularUser("u@test.pl");
        var owner = ownerWithEmail("owner@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(api));
        when(dictionaryEntryRepository.findById(changeTypeId)).thenReturn(Optional.of(changeType));
        when(dictionaryEntryRepository.findById(priorityId)).thenReturn(Optional.of(priority));
        // assign ID during save to avoid NPE in buildSubmittedVars (cr.getId().toString())
        when(repository.save(any())).thenAnswer(inv -> {
            ChangeRequestEntity e = inv.getArgument(0);
            if (e.getId() == null) e.setId(UUID.randomUUID());
            return e;
        });
        when(mapper.map(any(ChangeRequestEntity.class))).thenReturn(stubChangeRequestDto());
        when(ownerRepository.findByApiId(apiId)).thenReturn(List.of(owner));
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");
        doThrow(new RuntimeException("SMTP error")).when(emailService).sendEmail(anyString(), anyString(), anyString(), anyBoolean());

        // must not throw — exception from emailService is caught inside sendSubmittedNotification
        service.submit(new ChangeRequestSubmitRequest(apiId, "T", "D", changeTypeId, priorityId));
    }

    // ── review ────────────────────────────────────────────────────────────────

    @Test
    void review_submittedStatus_approvedDecision_changesStatusToApproved() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "MY-API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("owner@test.pl");
        var owner = ownerWithEmail("owner@test.pl");
        owner.setRole(entryWithCode("TECHNICAL_OWNER"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("owner@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.review(crId, new ChangeRequestReviewRequest(ReviewDecision.APPROVED, "LGTM", null, null));

        assertThat(cr.getStatus()).isEqualTo(ChangeRequestStatus.APPROVED);
    }

    @Test
    void review_statusNotAllowingReview_throwsAtlasException() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.APPROVED);
        var user = regularUser("owner@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));

        assertThatThrownBy(() -> service.review(crId,
                new ChangeRequestReviewRequest(ReviewDecision.APPROVED, null, null, null)))
                .isInstanceOf(AtlasException.class);
    }

    @Test
    void review_notApiOwner_throwsAccessForbiddenException() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("intruder@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("intruder@test.pl", api.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.review(crId,
                new ChangeRequestReviewRequest(ReviewDecision.APPROVED, null, null, null)))
                .isInstanceOf(AtlasAccessForbiddenException.class);
    }

    @Test
    void review_ownerRoleTechnical_resolverReturnsTechnicalOwner() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("tech@test.pl");
        var owner = ownerWithEmail("tech@test.pl");
        owner.setRole(entryWithCode("TECHNICAL_OWNER"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("tech@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.review(crId, new ChangeRequestReviewRequest(ReviewDecision.APPROVED, null, null, null));

        ArgumentCaptor<ChangeRequestReviewEntity> captor = ArgumentCaptor.forClass(ChangeRequestReviewEntity.class);
        verify(reviewRepository).save(captor.capture());
        assertThat(captor.getValue().getReviewerRole()).isEqualTo(ReviewerRole.TECHNICAL_OWNER);
    }

    @Test
    void review_ownerRoleBusiness_resolverReturnsBusinessOwner() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("biz@test.pl");
        var owner = ownerWithEmail("biz@test.pl");
        owner.setRole(entryWithCode("BUSINESS_OWNER"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("biz@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.review(crId, new ChangeRequestReviewRequest(ReviewDecision.REJECTED, null, null, null));

        ArgumentCaptor<ChangeRequestReviewEntity> captor = ArgumentCaptor.forClass(ChangeRequestReviewEntity.class);
        verify(reviewRepository).save(captor.capture());
        assertThat(captor.getValue().getReviewerRole()).isEqualTo(ReviewerRole.BUSINESS_OWNER);
    }

    @Test
    void review_ownerHasNoKnownRole_resolverFallsBackToAdmin() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("other@test.pl");
        var owner = ownerWithEmail("other@test.pl");
        owner.setRole(entryWithCode("SOMETHING_ELSE"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("other@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.review(crId, new ChangeRequestReviewRequest(ReviewDecision.DEFERRED, null, null, null));

        ArgumentCaptor<ChangeRequestReviewEntity> captor = ArgumentCaptor.forClass(ChangeRequestReviewEntity.class);
        verify(reviewRepository).save(captor.capture());
        assertThat(captor.getValue().getReviewerRole()).isEqualTo(ReviewerRole.ADMIN);
    }

    @Test
    void review_needsClarificationDecision_setsUnderReviewStatus() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("owner@test.pl");
        var owner = ownerWithEmail("owner@test.pl");
        owner.setRole(entryWithCode("TECHNICAL_OWNER"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("owner@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.review(crId, new ChangeRequestReviewRequest(ReviewDecision.NEEDS_CLARIFICATION, null, null, null));

        assertThat(cr.getStatus()).isEqualTo(ChangeRequestStatus.UNDER_REVIEW);
    }

    // ── markImplemented ───────────────────────────────────────────────────────

    @Test
    void markImplemented_approvedStatus_setsImplementedAndTimestamp() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.APPROVED);
        var user = regularUser("owner@test.pl");
        var owner = ownerWithEmail("owner@test.pl");
        owner.setRole(entryWithCode("TECHNICAL_OWNER"));

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("owner@test.pl", api.getId())).thenReturn(true);
        when(ownerRepository.findByApiId(api.getId())).thenReturn(List.of(owner));
        when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(repository.save(cr)).thenReturn(cr);
        when(mapper.map(cr)).thenReturn(stubChangeRequestDto());
        when(templateProcessing.processByCode(anyString(), any())).thenReturn("<html/>");

        service.markImplemented(crId, new MarkImplementedRequest("v2.0", "Done"));

        assertThat(cr.getStatus()).isEqualTo(ChangeRequestStatus.IMPLEMENTED);
        assertThat(cr.getImplementedAt()).isNotNull();
        assertThat(cr.getImplementedVersion()).isEqualTo("v2.0");
    }

    @Test
    void markImplemented_nonApprovedStatus_throwsAtlasException() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        when(userContextService.getCurrentUser()).thenReturn(regularUser("u@test.pl"));
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));

        assertThatThrownBy(() -> service.markImplemented(crId, new MarkImplementedRequest(null, null)))
                .isInstanceOf(AtlasException.class);
    }

    // ── cancel ────────────────────────────────────────────────────────────────

    @Test
    void cancel_submittedStatusAndOwner_setsCancelledAndInactive() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("owner@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("owner@test.pl", api.getId())).thenReturn(true);
        when(repository.save(cr)).thenReturn(cr);

        service.cancel(crId);

        assertThat(cr.getStatus()).isEqualTo(ChangeRequestStatus.CANCELLED);
        assertThat(cr.isActive()).isFalse();
    }

    @Test
    void cancel_terminalStatus_throwsAtlasException() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.IMPLEMENTED);

        when(userContextService.getCurrentUser()).thenReturn(regularUser("u@test.pl"));
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));

        assertThatThrownBy(() -> service.cancel(crId))
                .isInstanceOf(AtlasException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void cancel_notFound_throwsNotFoundException() {
        UUID crId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(regularUser("u@test.pl"));
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancel(crId))
                .isInstanceOf(ChangeRequestNotFoundException.class);
    }

    @Test
    void cancel_notApiOwner_throwsAccessForbiddenException() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        var user = regularUser("intruder@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("intruder@test.pl", api.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.cancel(crId))
                .isInstanceOf(AtlasAccessForbiddenException.class);
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_notFound_throwsNotFoundException() {
        UUID crId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(regularUser("u@test.pl"));
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(crId))
                .isInstanceOf(ChangeRequestNotFoundException.class);
    }

    @Test
    void findById_notOwnerNotRequester_throwsAccessForbidden() {
        UUID crId = UUID.randomUUID();
        var api = apiWithId(UUID.randomUUID(), "API");
        var cr = crWithStatus(crId, api, ChangeRequestStatus.SUBMITTED);
        cr.setRequesterEmail("requester@test.pl");
        cr.setRequesterUserId("other-id");
        var user = regularUser("stranger@test.pl");

        when(userContextService.getCurrentUser()).thenReturn(user);
        when(repository.findByIdAndActiveTrue(crId)).thenReturn(Optional.of(cr));
        when(ownerRepository.existsActiveApiEditOwner("stranger@test.pl", api.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.findById(crId))
                .isInstanceOf(AtlasAccessForbiddenException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AuthenticatedUser regularUser(String email) {
        return new AuthenticatedUser("uid-1", "Anna", "Nowak", email, Set.of("ATLAS_USER"));
    }

    private ApiEntity apiWithId(UUID id, String code) {
        var api = new ApiEntity();
        api.setId(id);
        api.setCode(code);
        api.setName("API " + code);
        return api;
    }

    private DictionaryEntryEntity entryWithCode(String code) {
        var entry = new DictionaryEntryEntity();
        entry.setId(UUID.randomUUID());
        entry.setCode(code);
        entry.setName(code);
        return entry;
    }

    private ApiOwnerEntity ownerWithEmail(String email) {
        var owner = new ApiOwnerEntity();
        owner.setId(UUID.randomUUID());
        owner.setEmail(email);
        owner.setFirstName("First");
        owner.setLastName("Last");
        owner.setValidFrom(LocalDate.now().minusYears(1));
        return owner;
    }

    private ChangeRequestEntity crWithStatus(UUID id, ApiEntity api, ChangeRequestStatus status) {
        var cr = new ChangeRequestEntity();
        cr.setId(id);
        cr.setApi(api);
        cr.setStatus(status);
        cr.setRequesterEmail("requester@test.pl");
        cr.setRequesterUserId("req-uid");
        cr.setTitle("Test CR");
        cr.setActive(true);
        cr.setChangeType(entryWithCode("MAJOR"));
        cr.setPriority(entryWithCode("HIGH"));
        return cr;
    }

    private ChangeRequestDto stubChangeRequestDto() {
        return null;
    }
}
