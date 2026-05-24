package pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainAttachmentEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DataDomainAttachmentRepository extends JpaRepository<DataDomainAttachmentEntity, UUID> {

    List<DataDomainAttachmentEntity> findAllByDataDomainId(UUID dataDomainId);

    Optional<DataDomainAttachmentEntity> findByIdAndDataDomainId(UUID id, UUID dataDomainId);
}
