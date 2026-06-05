package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ApiMessagingEndpointUpdateRequest(

        @NotBlank
        @Size(max = 300)
        String name,

        UUID endpointTypeId,

        UUID directionId,

        UUID messageFormatId,

        @Size(max = 4000)
        String description,

        int displayOrder
) {}
