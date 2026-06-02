package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.com.ww.mesh.atlas.api.domain.model.ApiGovernanceReviewEntity;

import java.util.List;
import java.util.UUID;

public interface ApiGovernanceReviewRepository extends JpaRepository<ApiGovernanceReviewEntity, UUID> {

    List<ApiGovernanceReviewEntity> findByApiIdOrderByReviewedAtDesc(UUID apiId);
}
