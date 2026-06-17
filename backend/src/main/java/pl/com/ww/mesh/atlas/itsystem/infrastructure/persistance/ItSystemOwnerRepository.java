package pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemOwnerEntity;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface ItSystemOwnerRepository extends JpaRepository<ItSystemOwnerEntity, UUID> {

    List<ItSystemOwnerEntity> findByItSystemId(UUID itSystemId);

    Optional<ItSystemOwnerEntity> findByItSystemIdAndEmailIgnoreCaseAndRoleId(UUID itSystemId, String email, UUID roleId);

    @Modifying
    @Query("DELETE FROM ItSystemOwnerEntity o WHERE o.itSystem.id = :systemId")
    void deleteAllByItSystemId(@Param("systemId") UUID systemId);

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

    /** Returns IDs of all systems where the user has any active ownership. */
    @Query(value = """
            SELECT DISTINCT iso.it_system_id
            FROM atlas.it_system_owner iso
            WHERE iso.email = :email
              AND (iso.valid_to IS NULL OR iso.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<UUID> findOwnedSystemIdsByEmail(@Param("email") String email);

    /** Returns true if user has any active ownership entry for this system. */
    @Query(value = """
            SELECT COUNT(*) > 0
            FROM atlas.it_system_owner iso
            WHERE iso.email = :email
              AND iso.it_system_id = :systemId
              AND (iso.valid_to IS NULL OR iso.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    boolean existsActiveOwnerByEmailAndSystemId(@Param("email") String email, @Param("systemId") UUID systemId);

    /** Returns IDs of systems where the user owns with a role that has canDefineApi=true. */
    @Query(value = """
            SELECT DISTINCT iso.it_system_id
            FROM atlas.it_system_owner iso
            JOIN atlas.dictionary_entry de ON de.id = iso.role_id
            WHERE iso.email = :email
              AND (de.metadata->>'canDefineApi')::boolean = true
              AND (iso.valid_to IS NULL OR iso.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<UUID> findDefineApiSystemIdsByEmail(@Param("email") String email);

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
