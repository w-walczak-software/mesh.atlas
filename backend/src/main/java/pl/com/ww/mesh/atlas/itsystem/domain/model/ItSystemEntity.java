package pl.com.ww.mesh.atlas.itsystem.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.hibernate.envers.RelationTargetAuditMode;
import org.hibernate.type.SqlTypes;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Audited
@AuditTable(value = "it_system_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "it_system",
        uniqueConstraints = @UniqueConstraint(name = "uq_it_system_code", columnNames = "code")
)
public class ItSystemEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "documentation_url", columnDefinition = "TEXT")
    private String documentationUrl;

    @Column(name = "repository_url", columnDefinition = "TEXT")
    private String repositoryUrl;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "status_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_it_system_status"))
    private DictionaryEntryEntity status;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lifecycle_stage_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_it_system_lifecycle_stage"))
    private DictionaryEntryEntity lifecycleStage;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_criticality_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_it_system_business_criticality"))
    private DictionaryEntryEntity businessCriticality;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "data_classification_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_it_system_data_classification"))
    private DictionaryEntryEntity dataClassification;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "system_type_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_it_system_type"))
    private DictionaryEntryEntity systemType;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architecture_style_id",
            foreignKey = @ForeignKey(name = "fk_it_system_architecture_style"))
    private DictionaryEntryEntity architectureStyle;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_model_id",
            foreignKey = @ForeignKey(name = "fk_it_system_deployment_model"))
    private DictionaryEntryEntity deploymentModel;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "runtime_environment_id",
            foreignKey = @ForeignKey(name = "fk_it_system_runtime_environment"))
    private DictionaryEntryEntity runtimeEnvironment;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scope_id",
            foreignKey = @ForeignKey(name = "fk_it_system_scope"))
    private DictionaryEntryEntity scope;

    @NotAudited
    @OneToMany(mappedBy = "itSystem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItSystemOwnerEntity> owners = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "active", nullable = false)
    private boolean active;
}
