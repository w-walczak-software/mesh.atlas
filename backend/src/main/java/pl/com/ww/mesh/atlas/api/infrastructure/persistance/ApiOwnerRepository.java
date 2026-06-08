package pl.com.ww.mesh.atlas.api.infrastructure.persistance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.com.ww.mesh.atlas.api.domain.model.ApiOwnerEntity;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ApiOwnerRepository extends JpaRepository<ApiOwnerEntity, UUID> {

    List<ApiOwnerEntity> findByApiId(UUID apiId);

    List<ApiOwnerEntity> findByEmailIgnoreCase(String email);

    /** Returns true if user has an active API ownership with canEditApi=true for this API. */
    @Query(value = """
            SELECT COUNT(ao.id) > 0
            FROM atlas.api_owner ao
            JOIN atlas.dictionary_entry de ON de.id = ao.role_id
            WHERE ao.email = :email
              AND ao.api_id = :apiId
              AND (de.metadata->>'canEditApi')::boolean = true
              AND (ao.valid_to IS NULL OR ao.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    boolean existsActiveApiEditOwner(@Param("email") String email, @Param("apiId") UUID apiId);

    /** Returns IDs of all APIs where user has an active ownership role with canEditApi=true. */
    @Query(value = """
            SELECT DISTINCT ao.api_id
            FROM atlas.api_owner ao
            JOIN atlas.dictionary_entry de ON de.id = ao.role_id
            WHERE ao.email = :email
              AND (de.metadata->>'canEditApi')::boolean = true
              AND (ao.valid_to IS NULL OR ao.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<UUID> findEditableApiIdsByEmail(@Param("email") String email);

    /** Returns IDs of all APIs where user has any active ownership role (for change request visibility). */
    @Query(value = """
            SELECT DISTINCT ao.api_id
            FROM atlas.api_owner ao
            WHERE ao.email = :email
              AND (ao.valid_to IS NULL OR ao.valid_to >= CURRENT_DATE)
            """, nativeQuery = true)
    Set<UUID> findActiveOwnedApiIds(@Param("email") String email);
}
