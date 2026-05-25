package pl.com.ww.mesh.atlas.datadomain.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record DataDomainUpdateRequest(

        @NotBlank
        @Size(max = 300)
        String name,

        @Size(max = 4000)
        String description,

        @Size(max = 2000)
        String documentationUrl,

        UUID groupId,

        List<String> tags,

        Map<String, Object> metadata
) {}
