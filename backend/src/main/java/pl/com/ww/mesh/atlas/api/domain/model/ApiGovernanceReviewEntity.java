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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "api_governance_review", schema = "atlas")
public class ApiGovernanceReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_api_governance_review_api"))
    private ApiEntity api;

    @Column(name = "action", nullable = false, length = 20)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false, length = 30)
    private GovernanceStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private GovernanceStatus newStatus;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", nullable = false, length = 100)
    private String reviewedBy;
}
