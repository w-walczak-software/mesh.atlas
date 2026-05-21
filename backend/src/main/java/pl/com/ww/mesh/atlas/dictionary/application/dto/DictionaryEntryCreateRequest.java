package pl.com.ww.mesh.atlas.dictionary.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record DictionaryEntryCreateRequest(
        @NotBlank
        @Size(max = 100)
        String code,

        @NotBlank
        @Size(max = 200)
        String name,

        @Size(max = 4000)
        String description,

        @Min(0)
        int displayOrder,

        Map<String, Object> metadata
) {}
