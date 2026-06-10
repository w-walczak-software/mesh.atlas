package pl.com.ww.mesh.atlas.changerequest.domain.model;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.hibernate.envers.RelationTargetAuditMode;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Audited
@AuditTable(value = "change_request_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "change_request", schema = "atlas")
public class ChangeRequestEntity extends AuditableEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "api_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cr_api"))
    private ApiEntity api;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "change_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cr_change_type"))
    private DictionaryEntryEntity changeType;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "priority_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cr_priority"))
    private DictionaryEntryEntity priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ChangeRequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "requester_type", nullable = false, length = 30)
    private RequesterType requesterType;

    @Column(name = "requester_user_id", length = 255)
    private String requesterUserId;

    @Column(name = "requester_email", nullable = false, length = 300)
    private String requesterEmail;

    @Column(name = "requester_name", length = 300)
    private String requesterName;

    @Column(name = "planned_implementation_date")
    private LocalDate plannedImplementationDate;

    @Column(name = "planned_version", length = 50)
    private String plannedVersion;

    @Column(name = "implemented_at")
    private LocalDateTime implementedAt;

    @Column(name = "implemented_version", length = 50)
    private String implementedVersion;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @NotAudited
    @OneToMany(mappedBy = "changeRequest", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChangeRequestReviewEntity> reviews = new ArrayList<>();
}
