package pl.com.ww.mesh.atlas.api.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import pl.com.ww.mesh.atlas.api.application.dto.ApiCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMapper;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMessagingEndpointMapper;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiOwnerMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiConsumerConflictException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiDuplicateCodeException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiMessagingEndpointRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.global.GovernanceService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasAccessForbiddenException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasGovernanceViolationException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance.TransportLayerRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApiServiceTest {

    @Mock private ApiRepository apiRepository;
    @Mock private ApiOwnerRepository ownerRepository;
    @Mock private ApiMessagingEndpointRepository messagingEndpointRepository;
    @Mock private DictionaryEntryRepository entryRepository;
    @Mock private ItSystemRepository itSystemRepository;
    @Mock private TransportLayerRepository transportLayerRepository;
    @Mock private DataDomainRepository dataDomainRepository;
    @Mock private ApiMapper mapper;
    @Mock private ApiOwnerMapper ownerMapper;
    @Mock private ApiMessagingEndpointMapper messagingEndpointMapper;
    @Mock private GovernanceService governanceService;
    @Mock private UserContextService userContextService;
    @Mock private ApiGovernanceNotificationService notificationService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private ApiRatingService ratingService;

    @InjectMocks
    private ApiService service;

    // ── findById / findByCode ─────────────────────────────────────────────────

    @Test
    void findById_notFound_throwsApiNotFoundException() {
        UUID id = UUID.randomUUID();
        when(apiRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(AtlasApiNotFoundException.class);
    }

    @Test
    void findByCode_notFound_throwsApiNotFoundException() {
        when(apiRepository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByCode("MISSING"))
                .isInstanceOf(AtlasApiNotFoundException.class);
    }

    // ── create: permission checks ─────────────────────────────────────────────

    @Test
    void create_nonPrivilegedUser_noPermissionForProducerSystem_throwsForbidden() {
        UUID producerSystemId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(regularUser("user@test.pl"));
        when(governanceService.getDefineApiSystemIds("user@test.pl")).thenReturn(Set.of());

        assertThatThrownBy(() -> service.create(minimalCreateRequest(producerSystemId, "MY-API")))
                .isInstanceOf(AtlasAccessForbiddenException.class);
        verify(apiRepository, never()).save(any());
    }

    // ── create: governance checks ─────────────────────────────────────────────

    @Test
    void create_governanceOn_emptyOwners_throwsGovernanceViolation() {
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);

        var request = new ApiCreateRequest(
                "MY-API", "API Name", null, null,
                null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, List.of(), List.of());

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(AtlasGovernanceViolationException.class);
        verify(apiRepository, never()).save(any());
    }

    // ── create: code uniqueness ───────────────────────────────────────────────

    @Test
    void create_duplicateCode_throwsDuplicateCodeException() {
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(false);
        when(apiRepository.existsByCode("MY-API")).thenReturn(true);

        assertThatThrownBy(() -> service.create(minimalCreateRequest(null, "MY-API")))
                .isInstanceOf(AtlasApiDuplicateCodeException.class);
        verify(apiRepository, never()).save(any());
    }

    // ── create: governance status assignment ──────────────────────────────────

    @Test
    void create_governanceOff_setsVerifiedImmediately() {
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(false);
        when(apiRepository.existsByCode("MY-API")).thenReturn(false);

        ApiEntity stubEntity = ApiEntity.builder().code("MY-API").build();
        when(mapper.map(any(ApiCreateRequest.class))).thenReturn(stubEntity);
        when(apiRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubMapperAndRating();

        service.create(minimalCreateRequest(null, "MY-API"));

        ArgumentCaptor<ApiEntity> captor = ArgumentCaptor.forClass(ApiEntity.class);
        verify(apiRepository).save(captor.capture());
        assertThat(captor.getValue().getGovernanceStatus()).isEqualTo(GovernanceStatus.VERIFIED);
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void create_governanceOn_creatorIsVerifier_setsVerifiedWithoutGovernanceEvent() {
        UUID roleId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);
        when(governanceService.isVerifierForSystem(eq("admin@test.pl"), any())).thenReturn(true);
        when(apiRepository.existsByCode("MY-API")).thenReturn(false);

        ApiEntity stubEntity = ApiEntity.builder().code("MY-API").build();
        when(mapper.map(any(ApiCreateRequest.class))).thenReturn(stubEntity);
        when(apiRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubOwnerProcessing(roleId);
        stubMapperAndRating();

        service.create(createRequestWithOwner("MY-API", roleId));

        ArgumentCaptor<ApiEntity> captor = ArgumentCaptor.forClass(ApiEntity.class);
        verify(apiRepository).save(captor.capture());
        assertThat(captor.getValue().getGovernanceStatus()).isEqualTo(GovernanceStatus.VERIFIED);
        verify(eventPublisher, never()).publishEvent(any(ApiGovernanceEvent.class));
    }

    @Test
    void create_governanceOn_creatorIsNotVerifier_setsPendingVerificationAndPublishesGovernanceEvent() {
        UUID roleId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);
        when(governanceService.isVerifierForSystem(eq("admin@test.pl"), any())).thenReturn(false);
        when(apiRepository.existsByCode("MY-API")).thenReturn(false);

        ApiEntity stubEntity = ApiEntity.builder().code("MY-API").build();
        when(mapper.map(any(ApiCreateRequest.class))).thenReturn(stubEntity);
        when(apiRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubOwnerProcessing(roleId);
        when(notificationService.buildCreateEvent(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(stubGovernanceEvent());
        stubMapperAndRating();

        service.create(createRequestWithOwner("MY-API", roleId));

        ArgumentCaptor<ApiEntity> captor = ArgumentCaptor.forClass(ApiEntity.class);
        verify(apiRepository).save(captor.capture());
        assertThat(captor.getValue().getGovernanceStatus()).isEqualTo(GovernanceStatus.PENDING_VERIFICATION);
        verify(eventPublisher).publishEvent(any(ApiGovernanceEvent.class));
    }

    // ── create: consumer / producer conflict ──────────────────────────────────

    @Test
    void create_producerSystemInConsumerList_throwsConsumerConflict() {
        UUID producerSystemId = UUID.randomUUID();
        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(false);
        when(apiRepository.existsByCode("MY-API")).thenReturn(false);

        var producerSystem = new ItSystemEntity();
        producerSystem.setId(producerSystemId);
        when(itSystemRepository.findById(producerSystemId)).thenReturn(Optional.of(producerSystem));

        ApiEntity stubEntity = ApiEntity.builder().build();
        when(mapper.map(any(ApiCreateRequest.class))).thenReturn(stubEntity);

        var request = new ApiCreateRequest(
                "MY-API", "API Name", null, null,
                null, null, producerSystemId, null,
                List.of(producerSystemId),   // producer also in consumers
                null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(AtlasApiConsumerConflictException.class);
    }

    // ── create: code generation ───────────────────────────────────────────────

    @Test
    void create_nullCode_generatesCodeFromProducerSystemPrefix() {
        UUID producerSystemId = UUID.randomUUID();

        var producerSystem = new ItSystemEntity();
        producerSystem.setId(producerSystemId);
        producerSystem.setCode("BILLING");

        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(false);
        // findById used both in generateCode and applyFkRefs(resolveItSystem)
        when(itSystemRepository.findById(producerSystemId)).thenReturn(Optional.of(producerSystem));
        when(apiRepository.existsByCode(any())).thenReturn(false);

        ApiEntity stubEntity = ApiEntity.builder().build();
        when(mapper.map(any(ApiCreateRequest.class))).thenReturn(stubEntity);
        when(apiRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubMapperAndRating();

        var request = new ApiCreateRequest(
                null,  // no code → auto-generate
                "API Name", null, null,
                null, null, producerSystemId, null, null,
                null, null, null, null, null, null,   // transportLayerId = null
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null);

        service.create(request);

        ArgumentCaptor<ApiEntity> captor = ArgumentCaptor.forClass(ApiEntity.class);
        verify(apiRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).startsWith("BIL");
    }

    // ── update: permission checks ─────────────────────────────────────────────

    @Test
    void update_nonPrivilegedUser_notOwnerAndNoDefinePermission_throwsForbidden() {
        UUID apiId = UUID.randomUUID();
        UUID producerSystemId = UUID.randomUUID();
        var entity = apiEntityWithProducer(apiId, producerSystemId);

        when(userContextService.getCurrentUser()).thenReturn(regularUser("user@test.pl"));
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        when(governanceService.getDefineApiSystemIds("user@test.pl")).thenReturn(Set.of());
        when(ownerRepository.existsActiveApiEditOwner("user@test.pl", apiId)).thenReturn(false);

        assertThatThrownBy(() -> service.update(apiId, minimalUpdateRequest(producerSystemId)))
                .isInstanceOf(AtlasAccessForbiddenException.class);
        verify(apiRepository, never()).save(any());
    }

    @Test
    void update_ownerTriesToChangeProducerSystem_throwsForbidden() {
        UUID apiId = UUID.randomUUID();
        UUID currentProducerSystemId = UUID.randomUUID();
        UUID newProducerSystemId = UUID.randomUUID();
        var entity = apiEntityWithProducer(apiId, currentProducerSystemId);

        when(userContextService.getCurrentUser()).thenReturn(regularUser("owner@test.pl"));
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        // user is an edit owner but NOT in define-api system set
        when(governanceService.getDefineApiSystemIds("owner@test.pl")).thenReturn(Set.of());
        when(ownerRepository.existsActiveApiEditOwner("owner@test.pl", apiId)).thenReturn(true);

        assertThatThrownBy(() -> service.update(apiId, minimalUpdateRequest(newProducerSystemId)))
                .isInstanceOf(AtlasAccessForbiddenException.class);
    }

    // ── update: governance status transitions ─────────────────────────────────

    @Test
    void update_governanceOn_verifierModifies_setsVerifiedStatus() {
        UUID apiId = UUID.randomUUID();
        var entity = apiEntityWithGovernanceStatus(apiId, GovernanceStatus.PENDING_REVIEW);

        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);
        when(governanceService.isVerifierForSystem(eq("admin@test.pl"), any())).thenReturn(true);
        when(apiRepository.save(entity)).thenReturn(entity);
        stubMapperAndRating();

        service.update(apiId, minimalUpdateRequest(null));

        assertThat(entity.getGovernanceStatus()).isEqualTo(GovernanceStatus.VERIFIED);
        assertThat(entity.getGovernanceNote()).isNull();
    }

    @Test
    void update_governanceOn_nonVerifierModifiesVerifiedApi_setsPendingReviewAndPublishesEvent() {
        UUID apiId = UUID.randomUUID();
        var entity = apiEntityWithGovernanceStatus(apiId, GovernanceStatus.VERIFIED);

        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);
        when(governanceService.isVerifierForSystem(eq("admin@test.pl"), any())).thenReturn(false);
        when(notificationService.buildModifyEvent(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(stubGovernanceEvent());
        when(apiRepository.save(entity)).thenReturn(entity);
        stubMapperAndRating();

        service.update(apiId, minimalUpdateRequest(null));

        assertThat(entity.getGovernanceStatus()).isEqualTo(GovernanceStatus.PENDING_REVIEW);
        verify(eventPublisher).publishEvent(any(ApiGovernanceEvent.class));
    }

    @Test
    void update_governanceOn_nonVerifierResubmitsAfterRejection_setsPendingVerification() {
        UUID apiId = UUID.randomUUID();
        var entity = apiEntityWithGovernanceStatus(apiId, GovernanceStatus.REQUIRES_MODIFICATION);

        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        when(governanceService.isGovernanceEnabledOnApiCreate()).thenReturn(true);
        when(governanceService.isVerifierForSystem(eq("admin@test.pl"), any())).thenReturn(false);
        when(notificationService.buildModifyEvent(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(stubGovernanceEvent());
        when(apiRepository.save(entity)).thenReturn(entity);
        stubMapperAndRating();

        service.update(apiId, minimalUpdateRequest(null));

        assertThat(entity.getGovernanceStatus()).isEqualTo(GovernanceStatus.PENDING_VERIFICATION);
        assertThat(entity.getGovernanceNote()).isNull();
        verify(eventPublisher).publishEvent(any(ApiGovernanceEvent.class));
    }

    // ── deactivate ────────────────────────────────────────────────────────────

    @Test
    void deactivate_notFound_throwsApiNotFoundException() {
        UUID id = UUID.randomUUID();
        when(apiRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deactivate(id))
                .isInstanceOf(AtlasApiNotFoundException.class);
    }

    @Test
    void deactivate_existingApi_setsActiveFalseAndPublishesSubscriptionEvent() {
        UUID apiId = UUID.randomUUID();
        var entity = apiEntityWithGovernanceStatus(apiId, GovernanceStatus.VERIFIED);
        entity.setActive(true);

        when(userContextService.getCurrentUser()).thenReturn(adminUser());
        when(apiRepository.findById(apiId)).thenReturn(Optional.of(entity));
        when(apiRepository.save(entity)).thenReturn(entity);

        service.deactivate(apiId);

        assertThat(entity.isActive()).isFalse();
        verify(eventPublisher).publishEvent(any(ApiSubscriptionChangeEvent.class));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private AuthenticatedUser adminUser() {
        return new AuthenticatedUser("admin-id", "Admin", "User", "admin@test.pl", Set.of("ATLAS_ADMIN"));
    }

    private AuthenticatedUser regularUser(String email) {
        return new AuthenticatedUser("user-id", "Jan", "Kowalski", email, Set.of("ATLAS_USER"));
    }

    private ApiCreateRequest minimalCreateRequest(UUID producerSystemId, String code) {
        return new ApiCreateRequest(
                code, "API Name", null, null,
                null, null, producerSystemId, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null);
    }

    private ApiCreateRequest createRequestWithOwner(String code, UUID roleId) {
        var owner = new ApiOwnerCreateRequest(roleId, "John", "Doe", "john@test.pl", LocalDate.now(), null);
        return new ApiCreateRequest(
                code, "API Name", null, null,
                null, null, null, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, List.of(owner), null);
    }

    private ApiUpdateRequest minimalUpdateRequest(UUID producerSystemId) {
        return new ApiUpdateRequest(
                "Updated Name", null, null,
                null, null, producerSystemId, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null);
    }

    private ApiEntity apiEntityWithProducer(UUID id, UUID producerSystemId) {
        var entity = ApiEntity.builder().build();
        entity.setId(id);
        entity.setCode("API-001");
        entity.setName("Test API");
        entity.setGovernanceStatus(GovernanceStatus.VERIFIED);
        var producerSystem = new ItSystemEntity();
        producerSystem.setId(producerSystemId);
        entity.setProducerSystem(producerSystem);
        return entity;
    }

    private ApiEntity apiEntityWithGovernanceStatus(UUID id, GovernanceStatus status) {
        var entity = ApiEntity.builder().build();
        entity.setId(id);
        entity.setCode("API-001");
        entity.setName("Test API");
        entity.setGovernanceStatus(status);
        return entity;
    }

    private void stubMapperAndRating() {
        when(mapper.map(any(ApiEntity.class))).thenReturn(stubApiDto());
        when(ratingService.getSummary(any())).thenReturn(new ApiRatingSummaryDto(0, 0.0, 0.0, Map.of()));
    }

    private void stubOwnerProcessing(UUID roleId) {
        var roleEntry = new DictionaryEntryEntity();
        roleEntry.setId(roleId);
        roleEntry.setCode("TECHNICAL_OWNER");
        when(entryRepository.findById(roleId)).thenReturn(Optional.of(roleEntry));
        when(ownerMapper.map(any(ApiOwnerCreateRequest.class))).thenReturn(new ApiOwnerEntity());
        when(ownerRepository.save(any(ApiOwnerEntity.class))).thenReturn(new ApiOwnerEntity());
    }

    private ApiDto stubApiDto() {
        return new ApiDto(
                UUID.randomUUID(), "CODE", "Name", null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null,
                true, GovernanceStatus.VERIFIED, null,
                false, false, false,
                null, null, null, null, null);
    }

    private ApiGovernanceEvent stubGovernanceEvent() {
        return new ApiGovernanceEvent("TPL", "Subject", null, null, "CODE", "Name", null, "admin@test.pl", null);
    }
}
