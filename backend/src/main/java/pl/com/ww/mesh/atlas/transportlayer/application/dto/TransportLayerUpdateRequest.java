package pl.com.ww.mesh.atlas.transportlayer.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record TransportLayerUpdateRequest(

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
