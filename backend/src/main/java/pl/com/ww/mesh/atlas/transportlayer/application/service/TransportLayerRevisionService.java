package pl.com.ww.mesh.atlas.transportlayer.application.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.proxy.HibernateProxy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.global.audit.AtlasRevisionEntity;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.global.audit.RevisionTypeDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemRefDto;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerDto;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransportLayerRevisionService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<RevisionEntryDto<TransportLayerDto>> getRevisions(UUID id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = reader.createQuery()
                .forRevisionsOfEntity(TransportLayerEntity.class, false, true)
                .add(AuditEntity.id().eq(id))
                .addOrder(AuditEntity.revisionNumber().desc())
                .getResultList();

        return rows.stream().map(this::toDto).toList();
    }

    private RevisionEntryDto<TransportLayerDto> toDto(Object[] row) {
        TransportLayerEntity entity = (TransportLayerEntity) row[0];
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
                buildSnapshot(entity)
        );
    }

    private TransportLayerDto buildSnapshot(TransportLayerEntity entity) {
        ItSystemRefDto itSystemRef = null;
        ItSystemEntity sys = resolveProxy(entity.getItSystem(), ItSystemEntity.class);
        if (sys != null) {
            itSystemRef = new ItSystemRefDto(sys.getId(), sys.getCode(), sys.getName(), sys.getIcon());
        }
        return new TransportLayerDto(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getIcon(),
                entity.getColor(),
                itSystemRef,
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy()
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
    private <T> T resolveProxy(T proxy, Class<T> type) {
        if (!(proxy instanceof HibernateProxy hp)) return proxy;
        UUID id = (UUID) hp.getHibernateLazyInitializer().getIdentifier();
        return id != null ? entityManager.find(type, id) : null;
    }
}
