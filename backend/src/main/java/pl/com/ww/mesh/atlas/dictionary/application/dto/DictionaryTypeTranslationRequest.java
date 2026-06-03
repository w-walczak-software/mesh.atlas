package pl.com.ww.mesh.atlas.dictionary.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DictionaryTypeTranslationRequest(
        @NotBlank
        @Size(max = 200)
        String name,

        @Size(max = 4000)
        String description
) {}
