package pl.com.ww.mesh.atlas.itsystem.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.audit.AtlasRevisionEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.global.audit.RevisionTypeDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemMapper;
import pl.com.ww.mesh.atlas.itsystem.application.mapper.ItSystemOwnerMapper;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItSystemRevisionService {

    private final EntityManager entityManager;
    private final ItSystemMapper mapper;
    private final ItSystemOwnerMapper ownerMapper;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<ItSystemDto>> getRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ItSystemEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> {
                    ItSystemEntity entity = (ItSystemEntity) row[0];
                    resolveSystemEntryRefs(entity);
                    return toDto(row, mapper.mapSnapshot(entity));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<ItSystemOwnerDto>> getOwnerRevisions(UUID systemId, UUID ownerId) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(ItSystemOwnerEntity.class, false, true)
                .add(AuditEntity.id().eq(ownerId))
                .add(AuditEntity.relatedId("itSystem").eq(systemId))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> {
                    ItSystemOwnerEntity entity = (ItSystemOwnerEntity) row[0];
                    entity.setRole(resolveEntry(entity.getRole()));
                    return toDto(row, ownerMapper.map(entity));
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

    // Envers creates delegate proxies for NOT_AUDITED @ManyToOne relations that query the AUD table.
    // We bypass this by reading the proxy's identifier and loading directly from the live table.
    private void resolveSystemEntryRefs(ItSystemEntity e) {
        e.setStatus(resolveEntry(e.getStatus()));
        e.setLifecycleStage(resolveEntry(e.getLifecycleStage()));
        e.setBusinessCriticality(resolveEntry(e.getBusinessCriticality()));
        e.setDataClassification(resolveEntry(e.getDataClassification()));
        e.setSystemType(resolveEntry(e.getSystemType()));
        e.setArchitectureStyle(resolveEntry(e.getArchitectureStyle()));
        e.setDeploymentModel(resolveEntry(e.getDeploymentModel()));
        e.setRuntimeEnvironment(resolveEntry(e.getRuntimeEnvironment()));
        e.setScope(resolveEntry(e.getScope()));
    }

    private DictionaryEntryEntity resolveEntry(DictionaryEntryEntity proxy) {
        if (!(proxy instanceof HibernateProxy hp)) return proxy;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        return id != null ? entityManager.find(DictionaryEntryEntity.class, id) : null;
    }
}
