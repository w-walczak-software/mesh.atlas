package pl.com.ww.mesh.atlas.email.application.dto;

import jakarta.validation.constraints.*;

public record EmailConfigSaveRequest(
        @NotBlank String provider,
        @NotBlank @Size(max = 255) String host,
        @Min(1) @Max(65535) int port,
        @Size(max = 255) String username,
        String password,
        @NotBlank @Email @Size(max = 255) String fromAddress,
        @Size(max = 200) String fromDisplayName,
        @NotBlank String encryption,
        boolean enabled
) {}
