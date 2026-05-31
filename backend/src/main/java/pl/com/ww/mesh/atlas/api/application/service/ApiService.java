package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiCreateRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.dto.ApiStatsDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiUpdateRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiConsumerConflictException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiDuplicateCodeException;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiSpecification;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;
import pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance.TransportLayerRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApiService {

    private final ApiRepository apiRepository;
    private final DictionaryEntryRepository entryRepository;
    private final ItSystemRepository itSystemRepository;
    private final TransportLayerRepository transportLayerRepository;
    private final DataDomainRepository dataDomainRepository;
    private final ApiMapper mapper;

    @Transactional(readOnly = true)
    public Page<ApiSummaryDto> findAll(ApiSearchCriteria criteria, Pageable pageable) {
        return apiRepository.findAll(new ApiSpecification(criteria), pageable)
                .map(mapper::mapSummary);
    }

    @Transactional(readOnly = true)
    public ApiStatsDto getStats() {
        long total = apiRepository.count();
        long active = apiRepository.countByActive(true);
        long inactive = apiRepository.countByActive(false);
        long addedLastMonth = apiRepository.countByCreatedAtAfter(LocalDateTime.now().minusMonths(1));
        long withSla = apiRepository.countBySlaResponseTimeMsIsNotNull();
        long withDocumentation = apiRepository.countWithDocumentation();
        long withVersion = apiRepository.countByApiVersionIsNotNull();
        return new ApiStatsDto(total, active, inactive, addedLastMonth, withSla, withDocumentation, withVersion);
    }

    @Transactional(readOnly = true)
    public ApiDto findById(UUID id) {
        return apiRepository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasApiNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public ApiDto findByCode(String code) {
        return apiRepository.findByCode(code)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasApiNotFoundException(code));
    }

    public ApiDto create(ApiCreateRequest request) {
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
        entity.getEnvironments().addAll(resolveEnvironments(request.environmentIds()));
        entity.getConsumerSystems().addAll(
                resolveConsumerSystems(request.consumerSystemIds(), request.producerSystemId()));

        return mapper.map(apiRepository.save(entity));
    }

    public ApiDto update(UUID id, ApiUpdateRequest request) {
        ApiEntity entity = getApiOrThrow(id);
        mapper.updateEntity(request, entity);
        applyFkRefs(entity,
                request.statusId(), request.typeId(),
                request.producerSystemId(), request.dataFlowDirectionId(),
                request.transportLayerId(),
                request.protocolId(), request.authenticationMethodId(),
                request.securityPolicyId(), request.integrationPatternId(),
                request.messageFormatId(), request.slaTierId(), request.contractTypeId());

        entity.getDataDomains().clear();
        entity.getDataDomains().addAll(resolveDataDomains(request.dataDomainIds()));
        entity.getEnvironments().clear();
        entity.getEnvironments().addAll(resolveEnvironments(request.environmentIds()));
        // Use element-level mutation (not clear+addAll) so Hibernate fires per-element
        // PostCollectionUpdateEvent that Envers needs to audit the join table correctly.
        applyConsumerSystemsDiff(entity, request.consumerSystemIds(), request.producerSystemId());

        return mapper.map(apiRepository.save(entity));
    }

    public void deactivate(UUID id) {
        ApiEntity entity = getApiOrThrow(id);
        entity.setActive(false);
        apiRepository.save(entity);
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

    private List<DictionaryEntryEntity> resolveEnvironments(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(entryRepository.findAllById(ids));
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
