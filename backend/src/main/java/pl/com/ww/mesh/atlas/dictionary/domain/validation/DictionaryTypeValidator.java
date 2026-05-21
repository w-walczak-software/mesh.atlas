package pl.com.ww.mesh.atlas.dictionary.domain.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DictionaryTypeValidator implements ConstraintValidator<DictionaryType, UUID> {

    private final DictionaryEntryRepository entryRepository;

    private String expectedCode;

    @Override
    public void initialize(DictionaryType annotation) {
        this.expectedCode = annotation.dictionaryCode();
    }

    @Override
    public boolean isValid(UUID id, ConstraintValidatorContext context) {
        if (id == null) {
            return true;
        }
        return entryRepository.existsByIdAndDictionaryTypeCodeAndActiveTrue(id, expectedCode);
    }
}
