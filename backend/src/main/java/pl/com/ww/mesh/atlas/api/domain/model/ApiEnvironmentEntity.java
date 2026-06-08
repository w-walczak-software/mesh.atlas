package pl.com.ww.mesh.atlas.api.domain.model;

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
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;

import java.util.UUID;

@Audited
@AuditTable(value = "api_environment_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "api_environment",
        schema = "atlas",
        uniqueConstraints = @UniqueConstraint(name = "uq_api_environment", columnNames = {"api_id", "dictionary_entry_id"})
)
public class ApiEnvironmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_environment_api"))
    private ApiEntity api;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dictionary_entry_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_environment_entry"))
    private DictionaryEntryEntity environment;

    @Column(name = "service_url", length = 2048)
    private String serviceUrl;
}
