package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ItSystemOwnerRepository extends JpaRepository<ItSystemOwnerEntity, UUID> {

    List<ItSystemOwnerEntity> findByItSystemId(UUID itSystemId);

    List<ItSystemOwnerEntity> findByEmailIgnoreCase(String email);

    /** Returns IDs of systems where the user owns with a role that has canVerifyApi=true. */
    @Query(value = """
            SELECT DISTINCT iso.it_system_id
            FROM atlas.it_system_owner iso
            JOIN atlas.dictionary_entry de ON de.id = iso.role_id
            WHERE iso.email = :email
              AND (de.metadata->>'canVerifyApi')::boolean = true
              AND (iso.valid_to IS NULL OR iso.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<UUID> findVerifiableSystemIdsByEmail(@Param("email") String email);

    /** Returns emails of all active verifiers for a given system (canVerifyApi=true). */
    @Query(value = """
            SELECT DISTINCT iso.email
            FROM atlas.it_system_owner iso
            JOIN atlas.dictionary_entry de ON de.id = iso.role_id
            WHERE iso.it_system_id = :systemId
              AND (de.metadata->>'canVerifyApi')::boolean = true
              AND (iso.valid_to IS NULL OR iso.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<String> findVerifierEmailsBySystemId(@Param("systemId") UUID systemId);
}
