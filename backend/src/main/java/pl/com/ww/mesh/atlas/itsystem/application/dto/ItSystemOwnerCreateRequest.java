package pl.com.ww.mesh.atlas.itsystem.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.dictionary.domain.validation.DictionaryType;

import java.time.LocalDate;
import java.util.UUID;

public record ItSystemOwnerCreateRequest(

        @NotNull
        @DictionaryType(dictionaryCode = "SYSTEM_OWNER_ROLE")
        UUID roleId,

        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @NotBlank
        @Email
        @Size(max = 200)
        String email,

        @NotNull
        LocalDate validFrom,

        LocalDate validTo
) {}
