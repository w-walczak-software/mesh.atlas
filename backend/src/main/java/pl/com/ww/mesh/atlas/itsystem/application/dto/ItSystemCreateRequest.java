package pl.com.ww.mesh.atlas.itsystem.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pl.com.ww.mesh.atlas.dictionary.domain.validation.DictionaryType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ItSystemCreateRequest(

        @NotBlank
        @Size(max = 100)
        @Pattern(
                regexp = "^[A-Z][A-Z0-9_-]*$",
                message = "Code must start with an uppercase letter and contain only uppercase letters, digits, underscores or hyphens"
        )
        String code,

        @NotBlank
        @Size(max = 300)
        String name,

        @Size(max = 4000)
        String description,

        @Size(max = 2000)
        String documentationUrl,

        @Size(max = 2000)
        String repositoryUrl,

        @NotNull
        @DictionaryType(dictionaryCode = "SYSTEM_STATUS")
        UUID statusId,

        @NotNull
        @DictionaryType(dictionaryCode = "LIFECYCLE_STAGE")
        UUID lifecycleStageId,

        @NotNull
        @DictionaryType(dictionaryCode = "BUSINESS_CRITICALITY")
        UUID businessCriticalityId,

        @NotNull
        @DictionaryType(dictionaryCode = "DATA_CLASSIFICATION")
        UUID dataClassificationId,

        @NotNull
        @DictionaryType(dictionaryCode = "SYSTEM_TYPE")
        UUID systemTypeId,

        @DictionaryType(dictionaryCode = "ARCHITECTURE_STYLE")
        UUID architectureStyleId,

        @DictionaryType(dictionaryCode = "DEPLOYMENT_MODEL")
        UUID deploymentModelId,

        @DictionaryType(dictionaryCode = "RUNTIME_ENVIRONMENT")
        UUID runtimeEnvironmentId,

        @DictionaryType(dictionaryCode = "SYSTEM_SCOPE")
        UUID scopeId,

        @Valid
        List<ItSystemOwnerCreateRequest> owners,

        List<String> tags,

        Map<String, Object> metadata,

        @Size(max = 100)
        String icon,

        @Size(max = 50)
        String externalId
) {}
