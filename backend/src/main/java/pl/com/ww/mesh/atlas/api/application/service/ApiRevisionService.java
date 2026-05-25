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
import pl.com.ww.mesh.atlas.api.application.dto.ApiDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiOwnerHistoryDto;
import pl.com.ww.mesh.atlas.api.application.dto.TransportLayerRefDto;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
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
import java.util.stream.Collectors;

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
        entity.setSourceSystem(resolveProxy(entity.getSourceSystem(), ItSystemEntity.class));
        entity.setTargetSystem(resolveProxy(entity.getTargetSystem(), ItSystemEntity.class));
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
                mapItSystem(entity.getSourceSystem()),
                mapItSystem(entity.getTargetSystem()),
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
                entity.getContractUrl(),
                entity.getDocumentationUrl(),
                entity.getTags(),
                Collections.emptyList(),
                Collections.emptyList(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy()
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

    @Transactional(readOnly = true)
    public List<ApiAttachmentHistoryDto> getAttachmentHistory(UUID apiId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        // DefaultAuditStrategy stores api_id = NULL for DEL revisions, so filtering
        // by relatedId("api") misses them. Step 1: collect non-DEL revisions (where
        // api_id is set) and build a last-known-state map for data restoration.
        @SuppressWarnings("unchecked")
        List<Object[]> linked = reader.createQuery()
                .forRevisionsOfEntity(ApiAttachmentEntity.class, false, false)
                .add(AuditEntity.relatedId("api").eq(apiId))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        if (linked.isEmpty()) {
            return List.of();
        }

        // Rows are desc by rev — putIfAbsent keeps the most recent snapshot per attachment.
        Map<UUID, ApiAttachmentEntity> lastKnownState = new LinkedHashMap<>();
        Set<UUID> attachmentIds = new LinkedHashSet<>();
        for (Object[] row : linked) {
            ApiAttachmentEntity entity = (ApiAttachmentEntity) row[0];
            attachmentIds.add(entity.getId());
            lastKnownState.putIfAbsent(entity.getId(), entity);
        }

        // Step 2: fetch all revisions including DEL for the collected attachment IDs.
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

        // DefaultAuditStrategy stores only the PK for DEL revisions; restore data
        // from the last known non-DEL snapshot so fileName/description are preserved.
        if (revType == RevisionType.DEL && entity.getFileName() == null) {
            ApiAttachmentEntity last = lastKnownState.get(entity.getId());
            if (last != null) entity = last;
        }

        DictionaryEntryEntity contractType = resolveEntry(entity.getContractType());

        return new ApiAttachmentHistoryDto(
                rev.getRev(),
                mapType(revType).name(),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                entity.getFileName(),
                entity.getDescription(),
                contractType != null ? contractType.getId() : null,
                contractType != null ? contractType.getName() : null
        );
    }
}
