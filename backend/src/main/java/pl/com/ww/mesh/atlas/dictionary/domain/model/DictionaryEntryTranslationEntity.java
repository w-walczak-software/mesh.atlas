package pl.com.ww.mesh.atlas.dictionary.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.UUID;

@Audited
@AuditTable(value = "dictionary_entry_translation_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "dictionary_entry_translation",
        uniqueConstraints = @UniqueConstraint(name = "uq_dictionary_entry_translation", columnNames = {"entry_id", "lang_code"})
)
public class DictionaryEntryTranslationEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "entry_id",
            nullable = false,
            updatable = false,
            foreignKey = @ForeignKey(name = "fk_dictionary_entry_translation_entry")
    )
    private DictionaryEntryEntity entry;

    @Column(name = "lang_code", nullable = false, length = 10, updatable = false)
    private String langCode;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
