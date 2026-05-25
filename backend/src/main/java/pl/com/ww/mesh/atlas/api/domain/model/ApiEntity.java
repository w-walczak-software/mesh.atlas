package pl.com.ww.mesh.atlas.api.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Audited
@AuditTable(value = "api_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "api",
        schema = "atlas",
        uniqueConstraints = @UniqueConstraint(name = "uq_api_code", columnNames = "code")
)
public class ApiEntity extends AuditableEntity {

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

    @Column(name = "api_version", length = 100)
    private String apiVersion;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id",
            foreignKey = @ForeignKey(name = "fk_api_type"))
    private DictionaryEntryEntity type;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "status_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_status"))
    private DictionaryEntryEntity status;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_system_id",
            foreignKey = @ForeignKey(name = "fk_api_source_system"))
    private ItSystemEntity sourceSystem;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_system_id",
            foreignKey = @ForeignKey(name = "fk_api_target_system"))
    private ItSystemEntity targetSystem;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transport_layer_id",
            foreignKey = @ForeignKey(name = "fk_api_transport_layer"))
    private TransportLayerEntity transportLayer;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "protocol_id",
            foreignKey = @ForeignKey(name = "fk_api_protocol"))
    private DictionaryEntryEntity protocol;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authentication_method_id",
            foreignKey = @ForeignKey(name = "fk_api_authentication_method"))
    private DictionaryEntryEntity authenticationMethod;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "security_policy_id",
            foreignKey = @ForeignKey(name = "fk_api_security_policy"))
    private DictionaryEntryEntity securityPolicy;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_pattern_id",
            foreignKey = @ForeignKey(name = "fk_api_integration_pattern"))
    private DictionaryEntryEntity integrationPattern;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_format_id",
            foreignKey = @ForeignKey(name = "fk_api_message_format"))
    private DictionaryEntryEntity messageFormat;

    @Column(name = "sla_response_time_ms")
    private Integer slaResponseTimeMs;

    @Column(name = "sla_uptime_pct", precision = 5, scale = 2)
    private BigDecimal slaUptimePct;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sla_tier_id",
            foreignKey = @ForeignKey(name = "fk_api_sla_tier"))
    private DictionaryEntryEntity slaTier;

    @Column(name = "sla_description", columnDefinition = "TEXT")
    private String slaDescription;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_type_id",
            foreignKey = @ForeignKey(name = "fk_api_contract_type"))
    private DictionaryEntryEntity contractType;

    @Column(name = "contract_url", columnDefinition = "TEXT")
    private String contractUrl;

    @Column(name = "documentation_url", columnDefinition = "TEXT")
    private String documentationUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    @NotAudited
    @OneToMany(mappedBy = "api", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ApiOwnerEntity> owners = new ArrayList<>();

    @NotAudited
    @OneToMany(mappedBy = "api", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ApiAttachmentEntity> attachments = new ArrayList<>();

    @NotAudited
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "api_data_domain",
            schema = "atlas",
            joinColumns = @JoinColumn(name = "api_id"),
            inverseJoinColumns = @JoinColumn(name = "data_domain_id")
    )
    @Builder.Default
    private List<DataDomainEntity> dataDomains = new ArrayList<>();

    @Column(name = "active", nullable = false)
    private boolean active;
}
