package pl.com.ww.mesh.atlas.datadomain.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentHistoryDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainDto;
import pl.com.ww.mesh.atlas.datadomain.application.mapper.DataDomainMapper;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainAttachmentEntity;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.audit.AtlasRevisionEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.global.audit.RevisionTypeDto;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DataDomainRevisionService {

    private final EntityManager entityManager;
    private final DataDomainMapper mapper;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<DataDomainDto>> getRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(DataDomainEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> {
                    AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
                    List<DataDomainAttachmentDto> attachments =
                            loadAttachmentsAtRevision(reader, id, rev.getRev());
                    DataDomainDto snapshot = buildSnapshot((DataDomainEntity) row[0], attachments);
                    return toDto(row, snapshot);
                })
                .toList();
    }

    @SuppressWarnings("unchecked")
    private List<DataDomainAttachmentDto> loadAttachmentsAtRevision(
            AuditReader reader, UUID domainId, long revNumber) {
        List<DataDomainAttachmentEntity> attachments = reader.createQuery()
                .forEntitiesAtRevision(DataDomainAttachmentEntity.class, revNumber)
                .add(AuditEntity.relatedId("dataDomain").eq(domainId))
                .getResultList();
        return attachments.stream()
                .map(mapper::mapAttachment)
                .toList();
    }

    private DataDomainDto buildSnapshot(DataDomainEntity entity,
                                        List<DataDomainAttachmentDto> attachments) {
        return new DataDomainDto(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getDocumentationUrl(),
                mapEntry(resolveEntry(entity.getGroup())),
                entity.getTags(),
                entity.getMetadata(),
                entity.isActive(),
                attachments,
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy()
        );
    }

    // Envers creates delegate proxies for NOT_AUDITED @ManyToOne relations that query the AUD table.
    // We bypass this by reading the proxy's identifier and loading directly from the live table.
    private DictionaryEntryEntity resolveEntry(DictionaryEntryEntity proxy) {
        if (!(proxy instanceof HibernateProxy hp)) return proxy;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        return id != null ? entityManager.find(DictionaryEntryEntity.class, id) : null;
    }

    private DictionaryEntryRefDto mapEntry(DictionaryEntryEntity entry) {
        if (entry == null) return null;
        return new DictionaryEntryRefDto(entry.getId(), entry.getCode(), entry.getName());
    }

    private RevisionEntryDto<DataDomainDto> toDto(Object[] row, DataDomainDto snapshot) {
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

    @Transactional(readOnly = true)
    public List<DataDomainAttachmentHistoryDto> getAttachmentHistory(UUID domainId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        // DefaultAuditStrategy stores dataDomain_id = NULL for DEL revisions, so
        // filtering by relatedId("dataDomain") misses them. Collect attachment IDs
        // from ADD/MOD revisions first, then query all revisions by those IDs.
        @SuppressWarnings("unchecked")
        List<Object[]> linked = reader.createQuery()
                .forRevisionsOfEntity(DataDomainAttachmentEntity.class, false, false)
                .add(AuditEntity.relatedId("dataDomain").eq(domainId))
                .getResultList();

        Set<UUID> attachmentIds = linked.stream()
                .map(row -> ((DataDomainAttachmentEntity) row[0]).getId())
                .collect(Collectors.toSet());

        if (attachmentIds.isEmpty()) {
            return List.of();
        }

        var disjunction = AuditEntity.disjunction();
        attachmentIds.forEach(id -> disjunction.add(AuditEntity.id().eq(id)));

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(DataDomainAttachmentEntity.class, false, true)
                .add(disjunction)
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream().map(this::toAttachmentHistoryDto).toList();
    }

    private DataDomainAttachmentHistoryDto toAttachmentHistoryDto(Object[] row) {
        DataDomainAttachmentEntity entity = (DataDomainAttachmentEntity) row[0];
        AtlasRevisionEntity rev = (AtlasRevisionEntity) row[1];
        RevisionType revType = (RevisionType) row[2];
        String timestamp = Instant.ofEpochMilli(rev.getRevtstmp())
                .atOffset(ZoneOffset.UTC)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return new DataDomainAttachmentHistoryDto(
                rev.getRev(),
                mapType(revType).name(),
                timestamp,
                rev.getUsername(),
                rev.getUserId(),
                entity.getFileName(),
                entity.getDescription()
        );
    }

    private RevisionTypeDto mapType(RevisionType type) {
        return switch (type) {
            case ADD -> RevisionTypeDto.ADDED;
            case MOD -> RevisionTypeDto.MODIFIED;
            case DEL -> RevisionTypeDto.DELETED;
        };
    }
}
