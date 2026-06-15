package pl.com.ww.mesh.atlas.integration.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "staging_it_system")
public class StagingItSystemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_staging_its_pipeline"))
    private IntegrationPipelineEntity pipeline;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "code", length = 100)
    private String code;

    @Column(name = "name", length = 300)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "documentation_url", columnDefinition = "TEXT")
    private String documentationUrl;

    @Column(name = "repository_url", columnDefinition = "TEXT")
    private String repositoryUrl;

    @Column(name = "raw_status", length = 500)
    private String rawStatus;

    @Column(name = "raw_lifecycle_stage", length = 500)
    private String rawLifecycleStage;

    @Column(name = "raw_business_criticality", length = 500)
    private String rawBusinessCriticality;

    @Column(name = "raw_data_classification", length = 500)
    private String rawDataClassification;

    @Column(name = "raw_system_type", length = 500)
    private String rawSystemType;

    @Column(name = "raw_architecture_style", length = 500)
    private String rawArchitectureStyle;

    @Column(name = "raw_deployment_model", length = 500)
    private String rawDeploymentModel;

    @Column(name = "raw_runtime_environment", length = 500)
    private String rawRuntimeEnvironment;

    @Column(name = "raw_scope", length = 500)
    private String rawScope;

    @Column(name = "icon", length = 100)
    private String icon;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags")
    private List<String> tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private Map<String, Object> metadata;

    @Enumerated(EnumType.STRING)
    @Column(name = "staging_status", nullable = false, length = 30)
    @Builder.Default
    private StagingStatus stagingStatus = StagingStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
