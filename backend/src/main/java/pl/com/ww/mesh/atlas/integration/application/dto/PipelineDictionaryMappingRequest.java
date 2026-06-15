package pl.com.ww.mesh.atlas.integration.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record PipelineDictionaryMappingRequest(
        @NotBlank @Size(max = 100)
        String dictionaryTypeCode,

        @NotBlank @Size(max = 500)
        String externalValue,

        @NotNull
        UUID atlasEntryId
) {}
