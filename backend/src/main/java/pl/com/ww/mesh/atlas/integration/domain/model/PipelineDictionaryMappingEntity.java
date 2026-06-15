package pl.com.ww.mesh.atlas.integration.domain.model;

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
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "pipeline_dictionary_mapping",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_pipeline_dict_mapping_entry",
                columnNames = {"pipeline_id", "atlas_entry_id"}
        )
)
public class PipelineDictionaryMappingEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pipeline_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pdm_pipeline"))
    private IntegrationPipelineEntity pipeline;

    @Column(name = "dictionary_type_code", nullable = false, length = 100)
    private String dictionaryTypeCode;

    @Column(name = "external_value", length = 500)
    private String externalValue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atlas_entry_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_pdm_atlas_entry"))
    private DictionaryEntryEntity atlasEntry;
}
