package pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChangeRequestRepository extends JpaRepository<ChangeRequestEntity, UUID>,
        JpaSpecificationExecutor<ChangeRequestEntity> {

    Optional<ChangeRequestEntity> findByIdAndActiveTrue(UUID id);

    Page<ChangeRequestEntity> findByApiIdAndActiveTrue(UUID apiId, Pageable pageable);

    long countByApiIdAndStatusIn(UUID apiId, java.util.List<ChangeRequestStatus> statuses);
}
