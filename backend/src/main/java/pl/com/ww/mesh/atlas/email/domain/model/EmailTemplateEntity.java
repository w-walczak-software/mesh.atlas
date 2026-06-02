package pl.com.ww.mesh.atlas.email.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import org.hibernate.type.SqlTypes;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Audited
@AuditTable(value = "email_template_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "email_template",
        uniqueConstraints = @UniqueConstraint(name = "uq_email_template_code", columnNames = "code")
)
public class EmailTemplateEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, length = 100, updatable = false)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "description", length = 2000)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", nullable = false, columnDefinition = "jsonb")
    private List<String> tags = new ArrayList<>();

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
