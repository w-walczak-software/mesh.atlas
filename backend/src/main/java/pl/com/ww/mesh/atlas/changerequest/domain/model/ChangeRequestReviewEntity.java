package pl.com.ww.mesh.atlas.changerequest.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "change_request_review", schema = "atlas")
public class ChangeRequestReviewEntity extends AuditableEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cr_id", nullable = false, foreignKey = @ForeignKey(name = "fk_crr_cr"))
    private ChangeRequestEntity changeRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "reviewer_role", nullable = false, length = 30)
    private ReviewerRole reviewerRole;

    @Column(name = "reviewer_id", nullable = false, length = 255)
    private String reviewerId;

    @Column(name = "reviewer_name", length = 300)
    private String reviewerName;

    @Column(name = "reviewer_email", nullable = false, length = 300)
    private String reviewerEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 30)
    private ReviewDecision decision;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;
}
