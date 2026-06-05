package pl.com.ww.mesh.atlas.transportlayer.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record TransportLayerCreateRequest(

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

        @Size(max = 100)
        String icon,

        @Size(max = 30)
        String color,

        Map<String, Object> metadata,

        UUID itSystemId
) {}
