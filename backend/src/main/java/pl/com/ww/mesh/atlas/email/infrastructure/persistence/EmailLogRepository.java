package pl.com.ww.mesh.atlas.email.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.email.domain.model.EmailLogEntity;

import java.util.UUID;

public interface EmailLogRepository extends JpaRepository<EmailLogEntity, UUID> {

    Page<EmailLogEntity> findAllByOrderBySentAtDesc(Pageable pageable);
}
