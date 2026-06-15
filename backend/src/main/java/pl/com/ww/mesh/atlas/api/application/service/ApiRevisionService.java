package pl.com.ww.mesh.atlas.api.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiAttachmentHistoryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiConsumerSystemHistoryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiEnvironmentHistoryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerHistoryDto;
import pl.com.ww.mesh.atlas.api.application.dto.TransportLayerRefDto;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEnvironmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.audit.AtlasRevisionEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.global.audit.RevisionTypeDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiRevisionService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<ApiDto>> getRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ApiEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> {
                    ApiEntity entity = (ApiEntity) row[0];
                    resolveEntityRefs(entity);
                    return toDto(row, buildSnapshot(entity));
                })
                .toList();
    }

    private <T> RevisionEntryDto<T> toDto(Object[] row, T snapshot) {
        AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
        RevisionType revType = (RevisionType) row[2];
        String timestamp = Instant.ofEpochMilli(rev.getRevtstmp())
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return new RevisionEntryDto<>(
                rev.getRev(),
                mapType(revType),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                snapshot
        );
    }

    private RevisionTypeDto mapType(RevisionType type) {
        return switch (type) {
            case ADD -> RevisionTypeDto.ADDED;
            case MOD -> RevisionTypeDto.MODIFIED;
            case DEL -> RevisionTypeDto.DELETED;
        };
    }

    private void resolveEntityRefs(ApiEntity entity) {
        entity.setStatus(resolveEntry(entity.getStatus()));
        entity.setType(resolveEntry(entity.getType()));
        entity.setProtocol(resolveEntry(entity.getProtocol()));
        entity.setAuthenticationMethod(resolveEntry(entity.getAuthenticationMethod()));
        entity.setSecurityPolicy(resolveEntry(entity.getSecurityPolicy()));
        entity.setIntegrationPattern(resolveEntry(entity.getIntegrationPattern()));
        entity.setMessageFormat(resolveEntry(entity.getMessageFormat()));
        entity.setSlaTier(resolveEntry(entity.getSlaTier()));
        entity.setContractType(resolveEntry(entity.getContractType()));
        entity.setDataFlowDirection(resolveEntry(entity.getDataFlowDirection()));
        entity.setProducerSystem(resolveProxy(entity.getProducerSystem(), ItSystemEntity.class));
        entity.setTransportLayer(resolveProxy(entity.getTransportLayer(), TransportLayerEntity.class));
    }

    private DictionaryEntryEntity resolveEntry(DictionaryEntryEntity proxy) {
        if (!(proxy instanceof HibernateProxy hp)) return proxy;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        return id != null ? entityManager.find(DictionaryEntryEntity.class, id) : null;
    }

    private <T> T resolveProxy(T proxy, Class<T> type) {
        if (!(proxy instanceof HibernateProxy hp)) return proxy;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        return id != null ? entityManager.find(type, id) : null;
    }

    private ApiDto buildSnapshot(ApiEntity entity) {
        return new ApiDto(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getApiVersion(),
                mapEntry(entity.getType()),
                mapEntry(entity.getStatus()),
                mapItSystem(entity.getProducerSystem()),
                mapEntry(entity.getDataFlowDirection()),
                Collections.emptyList(),           // consumerSystems — tracked in api_consumer_system_aud
                mapTransportLayer(entity.getTransportLayer()),
                mapEntry(entity.getProtocol()),
                mapEntry(entity.getAuthenticationMethod()),
                mapEntry(entity.getSecurityPolicy()),
                mapEntry(entity.getIntegrationPattern()),
                mapEntry(entity.getMessageFormat()),
                entity.getSlaResponseTimeMs(),
                entity.getSlaUptimePct(),
                mapEntry(entity.getSlaTier()),
                entity.getSlaDescription(),
                mapEntry(entity.getContractType()),
                entity.getContractVersion(),
                entity.getContractUrl(),
                entity.getDocumentationUrl(),
                entity.getTags(),
                Collections.emptyList(),
                Collections.emptyList(),
                entity.getExternalId(),
                null,
                entity.isActive(),
                entity.getGovernanceStatus(),
                entity.getGovernanceNote(),
                false,
                false,
                false,
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy(),
                null
        );
    }

    private DictionaryEntryRefDto mapEntry(DictionaryEntryEntity entry) {
        if (entry == null) return null;
        return new DictionaryEntryRefDto(entry.getId(), entry.getCode(), entry.getName());
    }

    private ItSystemRefDto mapItSystem(ItSystemEntity system) {
        if (system == null) return null;
        return new ItSystemRefDto(system.getId(), system.getCode(), system.getName(), system.getIcon());
    }

    private TransportLayerRefDto mapTransportLayer(TransportLayerEntity tl) {
        if (tl == null) return null;
        return new TransportLayerRefDto(tl.getId(), tl.getCode(), tl.getName(), tl.getIcon(), tl.getColor());
    }

    // ── Owner history ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ApiOwnerHistoryDto> getOwnerHistory(UUID apiId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ApiOwnerEntity.class, false, true)
                .add(AuditEntity.relatedId("api").eq(apiId))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream().map(this::toOwnerHistoryDto).toList();
    }

    private ApiOwnerHistoryDto toOwnerHistoryDto(Object[] row) {
        ApiOwnerEntity entity = (ApiOwnerEntity) row[0];
        AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
        RevisionType revType = (RevisionType) row[2];
        String timestamp = Instant.ofEpochMilli(rev.getRevtstmp())
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        DictionaryEntryEntity role = resolveEntry(entity.getRole());

        return new ApiOwnerHistoryDto(
                rev.getRev(),
                mapType(revType).name(),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                entity.getId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getEmail(),
                role != null ? role.getName() : null,
                entity.getValidFrom() != null ? entity.getValidFrom().toString() : null,
                entity.getValidTo() != null ? entity.getValidTo().toString() : null
        );
    }

    // ── Attachment history ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ApiAttachmentHistoryDto> getAttachmentHistory(UUID apiId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> linked = reader.createQuery()
                .forRevisionsOfEntity(ApiAttachmentEntity.class, false, false)
                .add(AuditEntity.relatedId("api").eq(apiId))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        if (linked.isEmpty()) {
            return List.of();
        }

        Map<UUID, ApiAttachmentEntity> lastKnownState = new LinkedHashMap<>();
        Set<UUID> attachmentIds = new LinkedHashSet<>();
        for (Object[] row : linked) {
            ApiAttachmentEntity entity = (ApiAttachmentEntity) row[0];
            attachmentIds.add(entity.getId());
            lastKnownState.putIfAbsent(entity.getId(), entity);
        }

        var disjunction = AuditEntity.disjunction();
        attachmentIds.forEach(id -> disjunction.add(AuditEntity.id().eq(id)));

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ApiAttachmentEntity.class, false, true)
                .add(disjunction)
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream().map(row -> toAttachmentHistoryDto(row, lastKnownState)).toList();
    }

    private ApiAttachmentHistoryDto toAttachmentHistoryDto(Object[] row,
                                                            Map<UUID, ApiAttachmentEntity> lastKnownState) {
        ApiAttachmentEntity entity = (ApiAttachmentEntity) row[0];
        AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
        RevisionType revType = (RevisionType) row[2];
        String timestamp = Instant.ofEpochMilli(rev.getRevtstmp())
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        if (revType == RevisionType.DEL && entity.getFileName() == null) {
            ApiAttachmentEntity last = lastKnownState.get(entity.getId());
            if (last != null) entity = last;
        }

        DictionaryEntryEntity contractType = resolveEntry(entity.getContractType());
        DictionaryEntryEntity attachmentStatus = resolveEntry(entity.getAttachmentStatus());

        return new ApiAttachmentHistoryDto(
                rev.getRev(),
                mapType(revType).name(),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                entity.getFileName(),
                entity.getDescription(),
                contractType != null ? contractType.getId() : null,
                contractType != null ? contractType.getName() : null,
                entity.getAttachmentVersion(),
                attachmentStatus != null ? attachmentStatus.getId() : null,
                attachmentStatus != null ? attachmentStatus.getName() : null
        );
    }

    // ── Environment history ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ApiEnvironmentHistoryDto> getEnvironmentHistory(UUID apiId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        // Step 1: collect all ApiEnvironmentEntity IDs ever linked to this API.
        // DEL entries have api_id = NULL in Envers, so we only query non-deleted
        // revisions here to gather the surrogate IDs.
        @SuppressWarnings("unchecked")
        List<Object[]> linked = reader.createQuery()
                .forRevisionsOfEntity(ApiEnvironmentEntity.class, false, false)
                .add(AuditEntity.relatedId("api").eq(apiId))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        if (linked.isEmpty()) {
            return List.of();
        }

        Map<UUID, ApiEnvironmentEntity> lastKnown = new LinkedHashMap<>();
        Set<UUID> envEntityIds = new LinkedHashSet<>();
        for (Object[] row : linked) {
            ApiEnvironmentEntity e = (ApiEnvironmentEntity) row[0];
            envEntityIds.add(e.getId());
            lastKnown.putIfAbsent(e.getId(), e);
        }

        // Step 2: fetch all revisions for those IDs, including DEL entries.
        var disjunction = AuditEntity.disjunction();
        envEntityIds.forEach(id -> disjunction.add(AuditEntity.id().eq(id)));

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ApiEnvironmentEntity.class, false, true)
                .add(disjunction)
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream().map(row -> toEnvironmentHistoryDto(row, lastKnown)).toList();
    }

    private ApiEnvironmentHistoryDto toEnvironmentHistoryDto(Object[] row,
                                                              Map<UUID, ApiEnvironmentEntity> lastKnown) {
        ApiEnvironmentEntity entity = (ApiEnvironmentEntity) row[0];
        AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
        RevisionType revType = (RevisionType) row[2];
        String timestamp = Instant.ofEpochMilli(rev.getRevtstmp())
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        if (revType == RevisionType.DEL && entity.getEnvironment() == null) {
            ApiEnvironmentEntity last = lastKnown.get(entity.getId());
            if (last != null) entity = last;
        }

        DictionaryEntryEntity envEntry = resolveEntry(entity.getEnvironment());
        return new ApiEnvironmentHistoryDto(
                rev.getRev(),
                mapType(revType).name(),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                envEntry != null ? envEntry.getCode() : null,
                envEntry != null ? envEntry.getName() : null,
                entity.getServiceUrl()
        );
    }

    // ── Consumer system history ──────────────────────────────────────────────

    /**
     * Returns the audit history of consumer system assignments for the given API.
     * Queries aud.api_consumer_system_aud directly via native SQL
     * (revtype 0 = ADDED, 2 = DELETED).
     */
    @Transactional(readOnly = true)
    public List<ApiConsumerSystemHistoryDto> getConsumerSystemHistory(UUID apiId) {
        String sql = """
                SELECT
                    CAST(acs.it_system_id AS VARCHAR) AS system_id,
                    acs.rev                           AS rev,
                    acs.revtype                       AS revtype,
                    r.rev_tstmp                       AS rev_tstmp,
                    r.username                        AS username,
                    r.user_id                         AS user_id,
                    s.code                            AS system_code,
                    s.name                            AS system_name,
                    s.icon                            AS system_icon
                FROM aud.api_consumer_system_aud acs
                JOIN aud.revinfo r ON r.rev = acs.rev
                LEFT JOIN it_system s ON s.id = acs.it_system_id
                WHERE acs.api_id = CAST(:apiId AS UUID)
                ORDER BY acs.rev DESC
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager
                .createNativeQuery(sql)
                .setParameter("apiId", apiId.toString())
                .getResultList();

        return rows.stream().map(row -> {
            String revType = switch (((Number) row[2]).intValue()) {
                case 0 -> "ADDED";
                case 2 -> "DELETED";
                default -> "MODIFIED";
            };
            long revtstmp = ((Number) row[3]).longValue();
            String timestamp = Instant.ofEpochMilli(revtstmp)
                    .atOffset(ZoneOffset.UTC)
                    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

            return new ApiConsumerSystemHistoryDto(
                    ((Number) row[1]).longValue(),
                    revType,
                    timestamp,
                    (String) row[4],
                    (String) row[5],
                    (String) row[0],
                    (String) row[6],
                    (String) row[7],
                    (String) row[8]
            );
        }).toList();
    }
}
