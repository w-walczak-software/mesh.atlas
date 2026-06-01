package pl.com.ww.mesh.atlas.audit.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditLogEntry;

import java.util.UUID;

public interface AuditLogRepository
        extends JpaRepository<AuditLogEntry, UUID>,
                JpaSpecificationExecutor<AuditLogEntry> {
}
