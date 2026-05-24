package pl.com.ww.mesh.atlas.datadomain.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record DataDomainCreateRequest(

        @NotBlank
        @Size(max = 100)
        @Pattern(
                regexp = "^[A-Z][A-Z0-9_-]*$",
                message = "Code must start with an uppercase letter and contain only uppercase letters, digits, underscores or hyphens"
        )
        String code,

        @NotBlank
        @Size(max = 300)
        String name,

        @Size(max = 4000)
        String description,

        @Size(max = 2000)
        String documentationUrl,

        List<String> tags,

        Map<String, Object> metadata
) {}
