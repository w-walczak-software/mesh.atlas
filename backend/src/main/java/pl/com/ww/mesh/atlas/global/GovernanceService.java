package pl.com.ww.mesh.atlas.global;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemOwnerRepository;
import pl.com.ww.mesh.atlas.systemparameter.infrastructure.persistence.SystemParameterRepository;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GovernanceService {

    private static final String GOVERNANCE_ENABLED_ON_API_CREATE = "GOVERNANCE_ENABLED_ON_API_CREATE";

    private final SystemParameterRepository systemParameterRepository;
    private final ItSystemOwnerRepository itSystemOwnerRepository;

    @Transactional(readOnly = true)
    public boolean isGovernanceEnabledOnApiCreate() {
        return systemParameterRepository.findByParameterKey(GOVERNANCE_ENABLED_ON_API_CREATE)
                .map(p -> Boolean.TRUE.equals(p.getBooleanValue()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isVerifierForSystem(String userEmail, UUID systemId) {
        if (userEmail == null || systemId == null) return false;
        return itSystemOwnerRepository.findVerifiableSystemIdsByEmail(userEmail).contains(systemId);
    }

    @Transactional(readOnly = true)
    public Set<UUID> getVerifiableSystemIds(String userEmail) {
        if (userEmail == null) return Set.of();
        return itSystemOwnerRepository.findVerifiableSystemIdsByEmail(userEmail);
    }

    @Transactional(readOnly = true)
    public Set<UUID> getDefineApiSystemIds(String userEmail) {
        if (userEmail == null) return Set.of();
        return itSystemOwnerRepository.findDefineApiSystemIdsByEmail(userEmail);
    }

    @Transactional(readOnly = true)
    public Set<String> getVerifierEmailsForSystem(UUID systemId) {
        if (systemId == null) return Set.of();
        return itSystemOwnerRepository.findVerifierEmailsBySystemId(systemId);
    }
}
