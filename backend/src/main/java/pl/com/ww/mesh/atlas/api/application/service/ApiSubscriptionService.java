package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionAdminRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSelfRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionStatsDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ExternalSubscriptionRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiSubscriptionMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiSubscriptionDuplicateException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiSubscriptionNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiSubscriptionEntity;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriberType;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionSource;
import pl.com.ww.mesh.atlas.api.domain.model.SubscriptionStatus;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiSubscriptionRepository;
import pl.com.ww.mesh.atlas.global.GovernanceService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasAccessForbiddenException;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ApiSubscriptionService {

    private final ApiSubscriptionRepository subscriptionRepository;
    private final ApiRepository apiRepository;
    private final ApiOwnerRepository ownerRepository;
    private final ApiSubscriptionMapper mapper;
    private final UserContextService userContextService;
    private final GovernanceService governanceService;

    // ── Self-subscription (authenticated user) ──────────────────────────────

    public ApiSubscriptionDto subscribe(ApiSubscriptionSelfRequest request) {
        var user = userContextService.getCurrentUser();
        var api = apiRepository.findById(request.apiId())
                .orElseThrow(() -> new AtlasApiNotFoundException(request.apiId().toString()));

        if (subscriptionRepository.existsByApiIdAndSubscriberUserIdAndStatus(
                request.apiId(), user.id(), SubscriptionStatus.ACTIVE)) {
            throw new AtlasApiSubscriptionDuplicateException();
        }

        ApiSubscriptionEntity entity = ApiSubscriptionEntity.builder()
                .api(api)
                .subscriberType(SubscriberType.INTERNAL)
                .subscriberUserId(user.id())
                .subscriberEmail(user.email())
                .subscriberName(user.firstName() != null ? user.firstName() + " " + (user.lastName() != null ? user.lastName() : "") : user.email())
                .status(SubscriptionStatus.ACTIVE)
                .source(SubscriptionSource.INTERNAL_PORTAL)
                .notificationsEnabled(true)
                .subscribedAt(LocalDateTime.now())
                .build();

        return mapper.map(subscriptionRepository.save(entity));
    }

    public void unsubscribeSelf(UUID subscriptionId) {
        var user = userContextService.getCurrentUser();
        ApiSubscriptionEntity entity = subscriptionRepository
                .findByIdAndSubscriberUserId(subscriptionId, user.id())
                .orElseThrow(() -> new AtlasApiSubscriptionNotFoundException(subscriptionId.toString()));

        entity.setStatus(SubscriptionStatus.INACTIVE);
        subscriptionRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public Page<ApiSubscriptionSummaryDto> findMySubscriptions(Pageable pageable) {
        var user = userContextService.getCurrentUser();
        return subscriptionRepository
                .findBySubscriberUserIdAndStatus(user.id(), SubscriptionStatus.ACTIVE, pageable)
                .map(mapper::mapSummary);
    }

    // ── Per-API subscriber view (API owners + ATLAS_ADMIN) ──────────────────

    @Transactional(readOnly = true)
    public Page<ApiSubscriptionSummaryDto> findSubscribersForApi(UUID apiId, Pageable pageable) {
        var user = userContextService.getCurrentUser();
        if (!user.isPrivileged()) {
            checkCanViewSubscribers(user, apiId);
        }
        return subscriptionRepository.findByApiId(apiId, pageable).map(mapper::mapSummary);
    }

    // ── Dashboard stats ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ApiSubscriptionStatsDto getStats() {
        var user = userContextService.getCurrentUser();

        long myActive = subscriptionRepository
                .countBySubscriberUserIdAndStatus(user.id(), SubscriptionStatus.ACTIVE);

        long managedApisSubscribers = 0;
        if (user.isPrivileged()) {
            managedApisSubscribers = subscriptionRepository
                    .countActiveCreatedSince(LocalDateTime.now().minusYears(100));
        } else {
            Set<UUID> defineApiSystemIds = governanceService.getDefineApiSystemIds(user.email());
            Set<UUID> editableApiIds = ownerRepository.findEditableApiIdsByEmail(user.email());
            if (!defineApiSystemIds.isEmpty() || !editableApiIds.isEmpty()) {
                List<UUID> managedApiIds = apiRepository.findAll().stream()
                        .filter(api -> {
                            UUID sysId = api.getProducerSystem() != null ? api.getProducerSystem().getId() : null;
                            return (sysId != null && defineApiSystemIds.contains(sysId))
                                    || editableApiIds.contains(api.getId());
                        })
                        .map(api -> api.getId())
                        .toList();
                if (!managedApiIds.isEmpty()) {
                    managedApisSubscribers = subscriptionRepository.countActiveByApiIds(managedApiIds);
                }
            }
        }

        long newLastWeek = subscriptionRepository
                .countActiveCreatedSince(LocalDateTime.now().minusDays(7));

        return new ApiSubscriptionStatsDto(myActive, managedApisSubscribers, newLastWeek);
    }

    // ── Admin CRUD (ATLAS_ADMIN) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ApiSubscriptionDto> findAll(Pageable pageable) {
        return subscriptionRepository.findAll(pageable).map(mapper::map);
    }

    public ApiSubscriptionDto adminCreate(ApiSubscriptionAdminRequest request) {
        var api = apiRepository.findById(request.apiId())
                .orElseThrow(() -> new AtlasApiNotFoundException(request.apiId().toString()));

        if (request.subscriberType() == SubscriberType.INTERNAL
                && request.subscriberUserId() != null
                && subscriptionRepository.existsByApiIdAndSubscriberUserIdAndStatus(
                        request.apiId(), request.subscriberUserId(), SubscriptionStatus.ACTIVE)) {
            throw new AtlasApiSubscriptionDuplicateException();
        }
        if (request.subscriberType() == SubscriberType.EXTERNAL
                && subscriptionRepository.existsByApiIdAndSubscriberEmailAndStatus(
                        request.apiId(), request.subscriberEmail(), SubscriptionStatus.ACTIVE)) {
            throw new AtlasApiSubscriptionDuplicateException();
        }

        ApiSubscriptionEntity entity = ApiSubscriptionEntity.builder()
                .api(api)
                .subscriberType(request.subscriberType())
                .subscriberUserId(request.subscriberUserId())
                .subscriberEmail(request.subscriberEmail())
                .subscriberName(request.subscriberName())
                .status(request.status())
                .source(request.source())
                .notificationsEnabled(request.notificationsEnabled())
                .subscribedAt(LocalDateTime.now())
                .build();

        return mapper.map(subscriptionRepository.save(entity));
    }

    public ApiSubscriptionDto adminUpdate(UUID id, ApiSubscriptionAdminRequest request) {
        ApiSubscriptionEntity entity = subscriptionRepository.findById(id)
                .orElseThrow(() -> new AtlasApiSubscriptionNotFoundException(id.toString()));

        entity.setSubscriberEmail(request.subscriberEmail());
        entity.setSubscriberName(request.subscriberName());
        entity.setSubscriberUserId(request.subscriberUserId());
        entity.setStatus(request.status());
        entity.setSource(request.source());
        entity.setNotificationsEnabled(request.notificationsEnabled());

        return mapper.map(subscriptionRepository.save(entity));
    }

    public void adminDelete(UUID id) {
        ApiSubscriptionEntity entity = subscriptionRepository.findById(id)
                .orElseThrow(() -> new AtlasApiSubscriptionNotFoundException(id.toString()));
        subscriptionRepository.delete(entity);
    }

    // ── External (dev portal) ───────────────────────────────────────────────

    public ApiSubscriptionDto subscribeExternal(ExternalSubscriptionRequest request) {
        var api = apiRepository.findById(request.apiId())
                .orElseThrow(() -> new AtlasApiNotFoundException(request.apiId().toString()));

        if (subscriptionRepository.existsByApiIdAndSubscriberEmailAndStatus(
                request.apiId(), request.email(), SubscriptionStatus.ACTIVE)) {
            throw new AtlasApiSubscriptionDuplicateException();
        }

        ApiSubscriptionEntity entity = ApiSubscriptionEntity.builder()
                .api(api)
                .subscriberType(SubscriberType.EXTERNAL)
                .subscriberEmail(request.email())
                .subscriberName(request.name())
                .status(SubscriptionStatus.PENDING_CONFIRMATION)
                .source(SubscriptionSource.DEVELOPER_PORTAL)
                .notificationsEnabled(true)
                .subscribedAt(LocalDateTime.now())
                .confirmationToken(UUID.randomUUID().toString())
                .build();

        return mapper.map(subscriptionRepository.save(entity));
    }

    public void confirmExternal(String token) {
        ApiSubscriptionEntity entity = subscriptionRepository.findByConfirmationToken(token)
                .orElseThrow(() -> new AtlasApiSubscriptionNotFoundException("token: " + token));

        entity.setStatus(SubscriptionStatus.ACTIVE);
        entity.setConfirmedAt(LocalDateTime.now());
        subscriptionRepository.save(entity);
    }

    public void unsubscribeExternal(String token) {
        ApiSubscriptionEntity entity = subscriptionRepository.findByConfirmationToken(token)
                .orElseThrow(() -> new AtlasApiSubscriptionNotFoundException("token: " + token));

        entity.setStatus(SubscriptionStatus.INACTIVE);
        subscriptionRepository.save(entity);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void checkCanViewSubscribers(AuthenticatedUser user, UUID apiId) {
        Set<UUID> defineApiSystemIds = governanceService.getDefineApiSystemIds(user.email());
        boolean canEdit = ownerRepository.existsActiveApiEditOwner(user.email(), apiId);
        boolean canDefineForSystem = apiRepository.findById(apiId)
                .map(api -> api.getProducerSystem() != null
                        && defineApiSystemIds.contains(api.getProducerSystem().getId()))
                .orElse(false);

        if (!canEdit && !canDefineForSystem) {
            throw new AtlasAccessForbiddenException(
                    "Only API owners or system managers can view subscriber lists");
        }
    }
}
