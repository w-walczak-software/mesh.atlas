package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiEnvironmentRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiMessagingEndpointCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.dto.ApiStatsDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMapper;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMessagingEndpointMapper;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiOwnerMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiConsumerConflictException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiDuplicateCodeException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEnvironmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiMessagingEndpointEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiMessagingEndpointRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiOwnerRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiSpecification;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.global.GovernanceService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasAccessForbiddenException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasGovernanceViolationException;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;
import pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance.TransportLayerRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApiService {

    private final ApiRepository apiRepository;
    private final ApiOwnerRepository ownerRepository;
    private final ApiMessagingEndpointRepository messagingEndpointRepository;
    private final DictionaryEntryRepository entryRepository;
    private final ItSystemRepository itSystemRepository;
    private final TransportLayerRepository transportLayerRepository;
    private final DataDomainRepository dataDomainRepository;
    private final ApiMapper mapper;
    private final ApiOwnerMapper ownerMapper;
    private final ApiMessagingEndpointMapper messagingEndpointMapper;
    private final GovernanceService governanceService;
    private final UserContextService userContextService;
    private final ApiGovernanceNotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final ApiRatingService ratingService;

    @Transactional(readOnly = true)
    public Page<ApiSummaryDto> findAll(ApiSearchCriteria criteria, Pageable pageable) {
        var user = userContextService.getCurrentUser();
        var verifiable = governanceService.getVerifiableSystemIds(user.email());
        Set<UUID> defineApiSystemIds = user.isPrivileged() ? Set.of() : governanceService.getDefineApiSystemIds(user.email());
        Set<UUID> editableApiIds = user.isPrivileged() ? Set.of() : ownerRepository.findEditableApiIdsByEmail(user.email());

        Page<ApiEntity> page = apiRepository.findAll(new ApiSpecification(criteria, user.email(), verifiable), pageable);
        List<UUID> ids = page.map(ApiEntity::getId).getContent();
        Map<UUID, ApiRatingSummaryDto> ratingsMap = ratingService.getSummaryMap(ids);

        return page.map(entity -> enrichSummary(mapper.mapSummary(entity), entity,
                user.isPrivileged(), defineApiSystemIds, editableApiIds, ratingsMap.get(entity.getId())));
    }

    private ApiSummaryDto enrichSummary(ApiSummaryDto base, ApiEntity entity, boolean privileged,
                                        Set<UUID> defineApiSystemIds, Set<UUID> editableApiIds,
                                        ApiRatingSummaryDto ratingsSummary) {
        boolean canEdit = privileged
                || (entity.getProducerSystem() != null && defineApiSystemIds.contains(entity.getProducerSystem().getId()))
                || editableApiIds.contains(entity.getId());
        return new ApiSummaryDto(base.id(), base.code(), base.name(), base.apiVersion(),
                base.type(), base.status(), base.producerSystem(), base.consumerSystems(),
                base.transportLayer(), base.tags(), base.active(), base.governanceStatus(), canEdit, ratingsSummary);
    }

    @Transactional(readOnly = true)
    public ApiStatsDto getStats() {
        long total = apiRepository.count();
        long active = apiRepository.countByActive(true);
        long inactive = apiRepository.countByActive(false);
        long deprecated = apiRepository.countDeprecated();
        long addedLastMonth = apiRepository.countByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
        long withSla = apiRepository.countBySlaResponseTimeMsIsNotNull();
        long withDocumentation = apiRepository.countWithDocumentation();
        long withVersion = apiRepository.countByApiVersionIsNotNull();
        long withDataDomain = apiRepository.countWithDataDomain();
        return new ApiStatsDto(total, active, inactive, deprecated, addedLastMonth, withSla, withDocumentation, withVersion, withDataDomain);
    }

    @Transactional(readOnly = true)
    public ApiDto findById(UUID id) {
        ApiEntity entity = apiRepository.findById(id)
                .orElseThrow(() -> new AtlasApiNotFoundException(id.toString()));
        return toApiDto(entity);
    }

    @Transactional(readOnly = true)
    public ApiDto findByCode(String code) {
        ApiEntity entity = apiRepository.findByCode(code)
                .orElseThrow(() -> new AtlasApiNotFoundException(code));
        return toApiDto(entity);
    }

    private ApiDto toApiDto(ApiEntity entity) {
        var user = userContextService.getCurrentUser();
        UUID producerSystemId = entity.getProducerSystem() != null ? entity.getProducerSystem().getId() : null;
        boolean canVerify = governanceService.isVerifierForSystem(user.email(), producerSystemId)
                && entity.getGovernanceStatus() != GovernanceStatus.VERIFIED;
        boolean canEdit;
        boolean canChangeProducerSystem;
        if (user.isPrivileged()) {
            canEdit = true;
            canChangeProducerSystem = true;
        } else {
            Set<UUID> defineApiSystemIds = governanceService.getDefineApiSystemIds(user.email());
            boolean canDefineForSystem = producerSystemId != null && defineApiSystemIds.contains(producerSystemId);
            boolean canEditAsOwner = ownerRepository.existsActiveApiEditOwner(user.email(), entity.getId());
            canEdit = canDefineForSystem || canEditAsOwner;
            canChangeProducerSystem = canDefineForSystem;
        }
        ApiDto base = mapper.map(entity);
        var rawSummary = ratingService.getSummary(entity.getId());
        ApiRatingSummaryDto ratingsSummary = rawSummary.ratingCount() == 0 ? null : rawSummary;
        return new ApiDto(base.id(), base.code(), base.name(), base.description(), base.apiVersion(),
                base.type(), base.status(), base.producerSystem(), base.dataFlowDirection(),
                base.consumerSystems(), base.transportLayer(), base.protocol(), base.authenticationMethod(),
                base.securityPolicy(), base.integrationPattern(), base.messageFormat(),
                base.slaResponseTimeMs(), base.slaUptimePct(), base.slaTier(), base.slaDescription(),
                base.contractType(), base.contractVersion(), base.contractUrl(), base.documentationUrl(),
                base.tags(), base.dataDomains(), base.environments(), base.externalId(), base.active(),
                base.governanceStatus(), base.governanceNote(), canVerify, canEdit, canChangeProducerSystem,
                base.createdAt(), base.createdBy(), base.updatedAt(), base.updatedBy(), ratingsSummary);
    }

    public ApiDto create(ApiCreateRequest request) {
        List<ApiOwnerCreateRequest> owners = request.owners() != null ? request.owners() : Collections.emptyList();
        var user = userContextService.getCurrentUser();

        if (!user.isPrivileged()) {
            Set<UUID> defineApiSystemIds = governanceService.getDefineApiSystemIds(user.email());
            if (!defineApiSystemIds.contains(request.producerSystemId())) {
                throw new AtlasAccessForbiddenException("not authorized to create APIs for this producer system");
            }
        }

        if (governanceService.isGovernanceEnabledOnApiCreate() && owners.isEmpty()) {
            throw new AtlasGovernanceViolationException("At least one API owner is required when governance is enabled");
        }

        String code = (request.code() == null || request.code().isBlank())
                ? generateCode(request.producerSystemId(), request.transportLayerId())
                : request.code();
        if (apiRepository.existsByCode(code)) {
            throw new AtlasApiDuplicateCodeException(code);
        }
        ApiEntity entity = mapper.map(request);
        entity.setCode(code);
        applyFkRefs(entity,
                request.statusId(), request.typeId(),
                request.producerSystemId(), request.dataFlowDirectionId(),
                request.transportLayerId(),
                request.protocolId(), request.authenticationMethodId(),
                request.securityPolicyId(), request.integrationPatternId(),
                request.messageFormatId(), request.slaTierId(), request.contractTypeId());

        entity.getDataDomains().addAll(resolveDataDomains(request.dataDomainIds()));
        entity.getEnvironments().addAll(buildEnvironments(request.environments(), entity));
        entity.getConsumerSystems().addAll(
                resolveConsumerSystems(request.consumerSystemIds(), request.producerSystemId()));

        // Set governance status: creator who is also a verifier gets VERIFIED immediately
        boolean pendingAfterCreate = false;
        if (governanceService.isGovernanceEnabledOnApiCreate()) {
            boolean creatorIsVerifier = governanceService.isVerifierForSystem(
                    user.email(), request.producerSystemId());
            if (creatorIsVerifier) {
                entity.setGovernanceStatus(GovernanceStatus.VERIFIED);
            } else {
                entity.setGovernanceStatus(GovernanceStatus.PENDING_VERIFICATION);
                pendingAfterCreate = true;
            }
        } else {
            entity.setGovernanceStatus(GovernanceStatus.VERIFIED);
        }

        ApiEntity saved = apiRepository.save(entity);
        owners.forEach(ownerRequest -> {
            ApiOwnerEntity owner = ownerMapper.map(ownerRequest);
            owner.setApi(saved);
            owner.setRole(resolveEntry(ownerRequest.roleId()));
            ownerRepository.save(owner);
        });
        List<ApiMessagingEndpointCreateRequest> endpoints =
                request.messagingEndpoints() != null ? request.messagingEndpoints() : Collections.emptyList();
        endpoints.forEach(epRequest -> {
            ApiMessagingEndpointEntity ep = messagingEndpointMapper.map(epRequest);
            ep.setApi(saved);
            ep.setEndpointType(resolveEntry(epRequest.endpointTypeId()));
            ep.setDirection(resolveEntry(epRequest.directionId()));
            ep.setMessageFormat(resolveEntry(epRequest.messageFormatId()));
            messagingEndpointRepository.save(ep);
        });

        if (pendingAfterCreate) {
            String sysName = saved.getProducerSystem() != null ? saved.getProducerSystem().getName() : null;
            eventPublisher.publishEvent(notificationService.buildCreateEvent(
                    request.producerSystemId(), sysName,
                    saved.getCode(), saved.getName(), saved.getApiVersion(),
                    user.email(), saved.getCreatedAt()));
        }

        return toApiDto(saved);
    }

    public ApiDto update(UUID id, ApiUpdateRequest request) {
        var user = userContextService.getCurrentUser();
        ApiEntity entity = getApiOrThrow(id);

        if (!user.isPrivileged()) {
            UUID currentProducerSystemId = entity.getProducerSystem() != null ? entity.getProducerSystem().getId() : null;
            Set<UUID> defineApiSystemIds = governanceService.getDefineApiSystemIds(user.email());
            boolean canDefineForCurrentSystem = defineApiSystemIds.contains(currentProducerSystemId);
            boolean canEditAsOwner = ownerRepository.existsActiveApiEditOwner(user.email(), id);

            if (!canDefineForCurrentSystem && !canEditAsOwner) {
                throw new AtlasAccessForbiddenException("not authorized to modify this API");
            }

            UUID requestedProducerSystemId = request.producerSystemId();
            boolean producerSystemChanging = requestedProducerSystemId != null
                    && !requestedProducerSystemId.equals(currentProducerSystemId);

            if (producerSystemChanging) {
                if (!canDefineForCurrentSystem) {
                    throw new AtlasAccessForbiddenException("API owner cannot change the producer system");
                }
                if (!defineApiSystemIds.contains(requestedProducerSystemId)) {
                    throw new AtlasAccessForbiddenException("not authorized to assign this producer system");
                }
            }
        }

        mapper.updateEntity(request, entity);
        applyFkRefs(entity,
                request.statusId(), request.typeId(),
                request.producerSystemId(), request.dataFlowDirectionId(),
                request.transportLayerId(),
                request.protocolId(), request.authenticationMethodId(),
                request.securityPolicyId(), request.integrationPatternId(),
                request.messageFormatId(), request.slaTierId(), request.contractTypeId());

        boolean pendingAfterUpdate = false;
        if (governanceService.isGovernanceEnabledOnApiCreate()) {
            UUID producerSystemId = entity.getProducerSystem() != null ? entity.getProducerSystem().getId() : null;
            boolean updaterIsVerifier = governanceService.isVerifierForSystem(user.email(), producerSystemId);

            if (updaterIsVerifier) {
                // Verifier modifying their own system's API → auto-approve
                entity.setGovernanceStatus(GovernanceStatus.VERIFIED);
                entity.setGovernanceNote(null);
            } else if (entity.getGovernanceStatus() == GovernanceStatus.VERIFIED) {
                // Published API modified by non-verifier → needs review (stays visible)
                entity.setGovernanceStatus(GovernanceStatus.PENDING_REVIEW);
                pendingAfterUpdate = true;
            } else if (entity.getGovernanceStatus() == GovernanceStatus.REQUIRES_MODIFICATION) {
                // Creator resubmits after rejection → back to pending
                entity.setGovernanceStatus(GovernanceStatus.PENDING_VERIFICATION);
                entity.setGovernanceNote(null);
                pendingAfterUpdate = true;
            }
        }

        entity.getDataDomains().clear();
        entity.getDataDomains().addAll(resolveDataDomains(request.dataDomainIds()));
        applyEnvironmentsDiff(entity, request.environments());
        // Use element-level mutation (not clear+addAll) so Hibernate fires per-element
        // PostCollectionUpdateEvent that Envers needs to audit the join table correctly.
        applyConsumerSystemsDiff(entity, request.consumerSystemIds(), request.producerSystemId());

        ApiEntity saved = apiRepository.save(entity);

        if (pendingAfterUpdate) {
            String sysName = saved.getProducerSystem() != null ? saved.getProducerSystem().getName() : null;
            UUID producerSystemId = saved.getProducerSystem() != null ? saved.getProducerSystem().getId() : null;
            eventPublisher.publishEvent(notificationService.buildModifyEvent(
                    producerSystemId, sysName,
                    saved.getCode(), saved.getName(), saved.getApiVersion(),
                    user.email(), saved.getUpdatedAt()));
        } else {
            // API stays VERIFIED (governance off, or auto-approved by verifier) → notify subscribers immediately
            String sysName = saved.getProducerSystem() != null ? saved.getProducerSystem().getName() : null;
            eventPublisher.publishEvent(new ApiSubscriptionChangeEvent(
                    saved.getId(), saved.getCode(), saved.getName(), saved.getApiVersion(),
                    sysName, "Modyfikacja API", user.email(), saved.getUpdatedAt()));
        }

        return toApiDto(saved);
    }

    public void deactivate(UUID id) {
        ApiEntity entity = getApiOrThrow(id);
        var user = userContextService.getCurrentUser();
        String sysName = entity.getProducerSystem() != null ? entity.getProducerSystem().getName() : null;
        entity.setActive(false);
        ApiEntity saved = apiRepository.save(entity);
        eventPublisher.publishEvent(new ApiSubscriptionChangeEvent(
                saved.getId(), saved.getCode(), saved.getName(), saved.getApiVersion(),
                sysName, "Dezaktywacja API", user.email(), saved.getUpdatedAt()));
    }

    public ApiDto updateDataDomains(UUID id, List<UUID> dataDomainIds) {
        ApiEntity entity = getApiOrThrow(id);
        entity.getDataDomains().clear();
        entity.getDataDomains().addAll(resolveDataDomains(dataDomainIds));
        return mapper.map(apiRepository.save(entity));
    }

    ApiEntity getApiOrThrow(UUID id) {
        return apiRepository.findById(id)
                .orElseThrow(() -> new AtlasApiNotFoundException(id.toString()));
    }

    DictionaryEntryEntity resolveEntry(UUID id) {
        if (id == null) return null;
        return entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
    }

    private ItSystemEntity resolveItSystem(UUID id) {
        if (id == null) return null;
        return itSystemRepository.findById(id)
                .orElseThrow(() -> new AtlasApiNotFoundException("IT System not found: " + id));
    }

    private TransportLayerEntity resolveTransportLayer(UUID id) {
        if (id == null) return null;
        return transportLayerRepository.findById(id)
                .orElseThrow(() -> new AtlasApiNotFoundException("Transport layer not found: " + id));
    }

    private List<DataDomainEntity> resolveDataDomains(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(dataDomainRepository.findAllById(ids));
    }

    private List<ApiEnvironmentEntity> buildEnvironments(List<ApiEnvironmentRequest> requests, ApiEntity api) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }
        return requests.stream().map(r -> {
            ApiEnvironmentEntity env = new ApiEnvironmentEntity();
            env.setApi(api);
            env.setEnvironment(resolveEntry(r.environmentId()));
            env.setServiceUrl(r.serviceUrl());
            return env;
        }).collect(Collectors.toList());
    }

    private void applyEnvironmentsDiff(ApiEntity entity, List<ApiEnvironmentRequest> requests) {
        List<ApiEnvironmentRequest> incoming = requests != null ? requests : Collections.emptyList();

        Map<UUID, ApiEnvironmentEntity> existing = entity.getEnvironments().stream()
                .collect(Collectors.toMap(e -> e.getEnvironment().getId(), e -> e));

        Set<UUID> incomingIds = incoming.stream()
                .map(ApiEnvironmentRequest::environmentId)
                .collect(Collectors.toSet());

        entity.getEnvironments().removeIf(e -> !incomingIds.contains(e.getEnvironment().getId()));

        for (ApiEnvironmentRequest r : incoming) {
            ApiEnvironmentEntity env = existing.get(r.environmentId());
            if (env != null) {
                env.setServiceUrl(r.serviceUrl());
            } else {
                ApiEnvironmentEntity newEnv = new ApiEnvironmentEntity();
                newEnv.setApi(entity);
                newEnv.setEnvironment(resolveEntry(r.environmentId()));
                newEnv.setServiceUrl(r.serviceUrl());
                entity.getEnvironments().add(newEnv);
            }
        }
    }

    private List<ItSystemEntity> resolveConsumerSystems(List<UUID> ids, UUID producerSystemId) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        if (producerSystemId != null && ids.contains(producerSystemId)) {
            throw new AtlasApiConsumerConflictException();
        }
        return new ArrayList<>(itSystemRepository.findAllById(ids));
    }

    /**
     * Updates the consumerSystems collection using element-level add/remove operations
     * instead of clear()+addAll(). This ensures Hibernate fires per-element
     * PostCollectionUpdateEvent events that Envers needs to correctly write rows
     * to aud.api_consumer_system_aud.
     */
    private void applyConsumerSystemsDiff(ApiEntity entity, List<UUID> newIds, UUID producerSystemId) {
        List<ItSystemEntity> incoming = resolveConsumerSystems(newIds, producerSystemId);
        Set<UUID> incomingIdSet = incoming.stream()
                .map(ItSystemEntity::getId)
                .collect(Collectors.toSet());

        // Remove systems that are no longer consumers (fires DEL event per element)
        entity.getConsumerSystems().removeIf(s -> !incomingIdSet.contains(s.getId()));

        // Add systems that are newly assigned as consumers (fires ADD event per element)
        Set<UUID> currentIds = entity.getConsumerSystems().stream()
                .map(ItSystemEntity::getId)
                .collect(Collectors.toSet());
        incoming.stream()
                .filter(s -> !currentIds.contains(s.getId()))
                .forEach(entity.getConsumerSystems()::add);
    }

    private String generateCode(UUID producerSystemId, UUID transportLayerId) {
        String sysPrefix = producerSystemId != null
                ? itSystemRepository.findById(producerSystemId)
                        .map(s -> s.getCode().length() >= 3 ? s.getCode().substring(0, 3) : s.getCode())
                        .orElse("API")
                : "API";
        String transportPrefix = transportLayerId != null
                ? transportLayerRepository.findById(transportLayerId)
                        .map(t -> t.getCode().length() >= 3 ? t.getCode().substring(0, 3) : t.getCode())
                        .orElse("")
                : "";
        String prefix = sysPrefix + transportPrefix;
        int seq = 1;
        String candidate;
        do {
            candidate = String.format("%s%03d", prefix, seq++);
        } while (apiRepository.existsByCode(candidate));
        return candidate;
    }

    private void applyFkRefs(ApiEntity entity,
                              UUID statusId, UUID typeId,
                              UUID producerSystemId, UUID dataFlowDirectionId,
                              UUID transportLayerId,
                              UUID protocolId, UUID authenticationMethodId,
                              UUID securityPolicyId, UUID integrationPatternId,
                              UUID messageFormatId, UUID slaTierId,
                              UUID contractTypeId) {
        entity.setStatus(resolveEntry(statusId));
        entity.setType(resolveEntry(typeId));
        entity.setProducerSystem(resolveItSystem(producerSystemId));
        entity.setDataFlowDirection(resolveEntry(dataFlowDirectionId));
        entity.setTransportLayer(resolveTransportLayer(transportLayerId));
        entity.setProtocol(resolveEntry(protocolId));
        entity.setAuthenticationMethod(resolveEntry(authenticationMethodId));
        entity.setSecurityPolicy(resolveEntry(securityPolicyId));
        entity.setIntegrationPattern(resolveEntry(integrationPatternId));
        entity.setMessageFormat(resolveEntry(messageFormatId));
        entity.setSlaTier(resolveEntry(slaTierId));
        entity.setContractType(resolveEntry(contractTypeId));
    }
}
