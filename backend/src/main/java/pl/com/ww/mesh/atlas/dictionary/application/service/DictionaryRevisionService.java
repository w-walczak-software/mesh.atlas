package pl.com.ww.mesh.atlas.dictionary.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryEntryMapper;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryTypeMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.global.audit.AtlasRevisionEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.global.audit.RevisionTypeDto;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DictionaryRevisionService {

    private final EntityManager entityManager;
    private final DictionaryTypeMapper typeMapper;
    private final DictionaryEntryMapper entryMapper;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<DictionaryTypeDto>> getTypeRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(DictionaryTypeEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> toDto(row, typeMapper.map((DictionaryTypeEntity) row[0])))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<DictionaryEntryDto>> getEntryRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(DictionaryEntryEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> {
                    DictionaryEntryEntity entity = (DictionaryEntryEntity) row[0];
                    resolveDictionaryTypeFromLive(entity);
                    return toDto(row, entryMapper.map(entity));
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
    private void resolveDictionaryTypeFromLive(DictionaryEntryEntity entity) {
        DictionaryTypeEntity proxy = entity.getDictionaryType();
        if (!(proxy instanceof HibernateProxy hp)) return;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        if (id != null) {
            entity.setDictionaryType(entityManager.find(DictionaryTypeEntity.class, id));
        }
    }
}
