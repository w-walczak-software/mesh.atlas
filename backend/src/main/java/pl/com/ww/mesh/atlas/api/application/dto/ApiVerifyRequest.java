package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.constraints.Size;

public record ApiVerifyRequest(
        @Size(max = 2000)
        String note
) {}
