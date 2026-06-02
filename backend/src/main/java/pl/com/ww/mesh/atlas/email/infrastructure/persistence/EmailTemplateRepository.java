package pl.com.ww.mesh.atlas.email.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.email.domain.model.EmailTemplateEntity;

import java.util.Optional;
import java.util.UUID;

public interface EmailTemplateRepository extends JpaRepository<EmailTemplateEntity, UUID> {

    boolean existsByCode(String code);

    Optional<EmailTemplateEntity> findByCode(String code);

    Page<EmailTemplateEntity> findAllByActive(boolean active, Pageable pageable);
}
