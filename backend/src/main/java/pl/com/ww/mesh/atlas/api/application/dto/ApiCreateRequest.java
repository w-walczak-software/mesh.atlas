package pl.com.ww.mesh.atlas.api.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ApiCreateRequest(

        @Size(max = 100)
        @Pattern(regexp = "^[A-Z][A-Z0-9_-]*$",
                message = "Code must start with an uppercase letter and contain only uppercase letters, digits, underscores, or hyphens")
        String code,

        @NotBlank
        @Size(max = 300)
        String name,

        @Size(max = 4000)
        String description,

        @Size(max = 100)
        String apiVersion,

        UUID typeId,

        @NotNull
        UUID statusId,

        UUID producerSystemId,
        UUID dataFlowDirectionId,
        List<UUID> consumerSystemIds,

        UUID transportLayerId,
        UUID protocolId,
        UUID authenticationMethodId,
        UUID securityPolicyId,
        UUID integrationPatternId,
        UUID messageFormatId,

        Integer slaResponseTimeMs,
        BigDecimal slaUptimePct,
        UUID slaTierId,

        @Size(max = 2000)
        String slaDescription,

        UUID contractTypeId,

        @Size(max = 100)
        String contractVersion,

        @Size(max = 2000)
        String contractUrl,

        @Size(max = 2000)
        String documentationUrl,

        List<String> tags,
        List<UUID> dataDomainIds,
        List<UUID> environmentIds,

        @Size(max = 50)
        String externalId,

        @Valid
        List<ApiOwnerCreateRequest> owners,

        @Valid
        List<ApiMessagingEndpointCreateRequest> messagingEndpoints
) {}
