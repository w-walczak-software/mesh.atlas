package pl.com.ww.mesh.atlas.changerequest.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestReviewEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeRequestReviewRepository extends JpaRepository<ChangeRequestReviewEntity, UUID> {

    List<ChangeRequestReviewEntity> findByChangeRequestIdOrderByReviewedAtDesc(UUID changeRequestId);
}
