package pl.com.ww.mesh.atlas.changerequest.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.dictionary.domain.validation.DictionaryType;

import java.util.UUID;

public record ChangeRequestSubmitRequest(

        @NotNull
        UUID apiId,

        @NotBlank
        @Size(max = 255)
        String title,

        @NotBlank
        @Size(max = 8000)
        String description,

        @NotNull
        @DictionaryType(dictionaryCode = "CHANGE_REQUEST_TYPE")
        UUID changeTypeId,

        @NotNull
        @DictionaryType(dictionaryCode = "CHANGE_REQUEST_PRIORITY")
        UUID priorityId
) {}
