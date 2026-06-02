package pl.com.ww.mesh.atlas.email.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record EmailTemplateUpdateRequest(
        @NotBlank
        @Size(max = 500)
        String title,

        @NotBlank
        String body,

        @Size(max = 2000)
        String description,

        @NotNull
        List<@NotBlank @Size(max = 100) @Pattern(regexp = "^[a-zA-Z][a-zA-Z0-9_]*$") String> tags
) {}
