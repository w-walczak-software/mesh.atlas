package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record ApiOwnerUpdateRequest(

        @NotNull
        UUID roleId,

        @NotBlank
        @Size(max = 150)
        String firstName,

        @NotBlank
        @Size(max = 150)
        String lastName,

        @Email
        @NotBlank
        @Size(max = 300)
        String email,

        @NotNull
        LocalDate validFrom,

        LocalDate validTo
) {}
