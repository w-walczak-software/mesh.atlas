package pl.com.ww.mesh.atlas.email.domain.model;

import jakarta.persistence.*;
import lombok.*;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "email_config",
        uniqueConstraints = @UniqueConstraint(name = "uq_email_config_key", columnNames = {"config_key"})
)
public class EmailConfigEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "config_key", nullable = false, length = 50, updatable = false)
    private String configKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 50)
    private EmailProvider provider;

    @Column(name = "host", length = 255)
    private String host;

    @Column(name = "port", nullable = false)
    private int port;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "password", columnDefinition = "TEXT")
    private String password;

    @Column(name = "from_address", length = 255)
    private String fromAddress;

    @Column(name = "from_display_name", length = 200)
    private String fromDisplayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "encryption", nullable = false, length = 20)
    private EmailEncryption encryption;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;
}
