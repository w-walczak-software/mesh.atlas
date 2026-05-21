package pl.com.ww.mesh.atlas.dictionary.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DictionaryTypeCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "Code must start with an uppercase letter and contain only uppercase letters, digits and underscores")
        String code,

        @NotBlank
        @Size(max = 200)
        String name,

        @Size(max = 4000)
        String description,

        boolean systemDefined
) {}
