package pl.com.ww.mesh.atlas.dictionary.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.UUID;

@Audited
@AuditTable(value = "dictionary_type_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "dictionary_type",
        uniqueConstraints = @UniqueConstraint(name = "uq_dictionary_type_code", columnNames = "code")
)
public class DictionaryTypeEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "system_defined", nullable = false)
    private boolean systemDefined;

    @Column(name = "active", nullable = false)
    private boolean active;
}
