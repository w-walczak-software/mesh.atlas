package pl.com.ww.mesh.atlas.dictionary.domain.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a UUID references an active {@code dictionary_entry}
 * belonging to the expected dictionary type.
 *
 * <p>Usage on DTO fields:
 * <pre>
 *   {@literal @}NotNull
 *   {@literal @}DictionaryType(dictionaryCode = "SYSTEM_STATUS")
 *   UUID statusId;
 * </pre>
 */
@Documented
@Constraint(validatedBy = DictionaryTypeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface DictionaryType {

    String dictionaryCode();

    String message() default "Dictionary entry does not belong to the expected type or is inactive";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
