package pl.com.ww.mesh.atlas.email.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TestEmailRequest(
        @NotBlank @Email @Size(max = 500) String recipient
) {}
