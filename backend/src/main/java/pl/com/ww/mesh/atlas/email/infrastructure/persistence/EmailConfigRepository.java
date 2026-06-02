package pl.com.ww.mesh.atlas.email.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.email.domain.model.EmailConfigEntity;

import java.util.Optional;
import java.util.UUID;

public interface EmailConfigRepository extends JpaRepository<EmailConfigEntity, UUID> {

    Optional<EmailConfigEntity> findByConfigKey(String configKey);
}
