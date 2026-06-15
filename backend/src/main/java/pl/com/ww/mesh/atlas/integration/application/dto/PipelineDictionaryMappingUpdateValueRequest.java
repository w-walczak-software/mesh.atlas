package pl.com.ww.mesh.atlas.integration.application.dto;

import jakarta.validation.constraints.Size;

public record PipelineDictionaryMappingUpdateValueRequest(
        @Size(max = 500)
        String externalValue
) {}
