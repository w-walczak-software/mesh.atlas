package pl.com.ww.mesh.atlas.changerequest.application.dto;

import jakarta.validation.constraints.Size;

public record MarkImplementedRequest(

        @Size(max = 50)
        String implementedVersion,

        @Size(max = 2000)
        String note
) {}
