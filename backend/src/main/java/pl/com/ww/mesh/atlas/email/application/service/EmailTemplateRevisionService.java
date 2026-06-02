package pl.com.ww.mesh.atlas.email.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateDto;
import pl.com.ww.mesh.atlas.email.application.mapper.EmailTemplateMapper;
import pl.com.ww.mesh.atlas.email.domain.model.EmailTemplateEntity;
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
public class EmailTemplateRevisionService {

    private final EntityManager entityManager;
    private final EmailTemplateMapper mapper;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<EmailTemplateDto>> getRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(EmailTemplateEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream()
                .map(row -> toDto(row, mapper.map((EmailTemplateEntity) row[0])))
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
}
