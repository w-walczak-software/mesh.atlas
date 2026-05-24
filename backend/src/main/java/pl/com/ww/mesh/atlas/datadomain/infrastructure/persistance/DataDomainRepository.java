package pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;

import java.util.Optional;
import java.util.UUID;

public interface DataDomainRepository extends JpaRepository<DataDomainEntity, UUID>,
        JpaSpecificationExecutor<DataDomainEntity> {

    boolean existsByCode(String code);

    Optional<DataDomainEntity> findByCode(String code);
}
