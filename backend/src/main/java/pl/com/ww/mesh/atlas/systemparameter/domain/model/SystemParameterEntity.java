package pl.com.ww.mesh.atlas.systemparameter.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.AuditTable;
import org.hibernate.envers.Audited;
import pl.com.ww.mesh.atlas.global.domain.common.AuditableEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Audited
@AuditTable(value = "system_parameter_aud", schema = "aud")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "system_parameter",
        uniqueConstraints = @UniqueConstraint(name = "uq_system_parameter_key", columnNames = {"parameter_key"})
)
public class SystemParameterEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "parameter_key", nullable = false, length = 100, updatable = false)
    private String parameterKey;

    @Column(name = "parameter_name", nullable = false, length = 200)
    private String parameterName;

    @Enumerated(EnumType.STRING)
    @Column(name = "parameter_type", nullable = false, length = 20, updatable = false)
    private SystemParameterType parameterType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "string_value", columnDefinition = "TEXT")
    private String stringValue;

    @Column(name = "integer_value")
    private Long integerValue;

    @Column(name = "decimal_value", precision = 19, scale = 4)
    private BigDecimal decimalValue;

    @Column(name = "boolean_value")
    private Boolean booleanValue;

    @Column(name = "date_value")
    private LocalDate dateValue;

    @Column(name = "datetime_value")
    private LocalDateTime datetimeValue;

    @Column(name = "system_defined", nullable = false)
    private boolean systemDefined;
}
