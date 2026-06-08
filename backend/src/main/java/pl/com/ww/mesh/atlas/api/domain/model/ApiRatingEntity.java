package pl.com.ww.mesh.atlas.api.domain.model;

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
@AuditTable(value = "api_rating_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "api_rating",
        schema = "atlas",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_api_rating_rater",
                columnNames = {"api_id", "rater_id", "rater_type"}
        )
)
public class ApiRatingEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_id", nullable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_api_rating_api"))
    private ApiEntity api;

    @Column(name = "rater_id", nullable = false, updatable = false, length = 255)
    private String raterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rater_type", nullable = false, updatable = false, length = 30)
    private RaterType raterType;

    @Column(name = "score", nullable = false)
    private int score;
}
