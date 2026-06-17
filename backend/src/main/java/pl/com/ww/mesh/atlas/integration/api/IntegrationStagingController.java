package pl.com.ww.mesh.atlas.integration.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingApiDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingBulkActionRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingDataDomainDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemOwnerDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingPromoteResultDto;
import pl.com.ww.mesh.atlas.integration.application.service.IntegrationPipelineService;
import pl.com.ww.mesh.atlas.integration.application.service.StagingReviewService;
import pl.com.ww.mesh.atlas.integration.application.service.StagingViewService;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/pipelines/{pipelineId}/staging")
@RequiredArgsConstructor
public class IntegrationStagingController {

    private final StagingViewService stagingViewService;
    private final StagingReviewService stagingReviewService;
    private final IntegrationPipelineService pipelineService;
    private final UserContextService userContextService;

    @GetMapping("/it-systems")
    @IsAtlasAdmin
    public List<StagingItSystemDto> getItSystems(@PathVariable UUID pipelineId) {
        assertTargetEntity(pipelineId, TargetEntityType.IT_SYSTEM);
        return stagingViewService.findItSystemsByPipeline(pipelineId);
    }

    @GetMapping("/it-system-owners")
    @IsAtlasAdmin
    public List<StagingItSystemOwnerDto> getItSystemOwners(@PathVariable UUID pipelineId) {
        assertTargetEntity(pipelineId, TargetEntityType.IT_SYSTEM);
        return stagingViewService.findItSystemOwnersByPipeline(pipelineId);
    }

    @GetMapping("/apis")
    @IsAtlasAdmin
    public List<StagingApiDto> getApis(@PathVariable UUID pipelineId) {
        assertTargetEntity(pipelineId, TargetEntityType.API);
        return stagingViewService.findApisByPipeline(pipelineId);
    }

    @GetMapping("/data-domains")
    @IsAtlasAdmin
    public List<StagingDataDomainDto> getDataDomains(@PathVariable UUID pipelineId) {
        assertTargetEntity(pipelineId, TargetEntityType.DATA_DOMAIN);
        return stagingViewService.findDataDomainsByPipeline(pipelineId);
    }

    @PatchMapping("/accept")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptItems(@PathVariable UUID pipelineId, @RequestBody StagingBulkActionRequest request) {
        stagingReviewService.acceptItems(pipelineId, request.ids());
    }

    @PatchMapping("/reject")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectItems(@PathVariable UUID pipelineId, @RequestBody StagingBulkActionRequest request) {
        stagingReviewService.rejectItems(pipelineId, request.ids());
    }

    @PostMapping("/promote")
    @IsAtlasAdmin
    public StagingPromoteResultDto promoteAccepted(@PathVariable UUID pipelineId) {
        String promotedBy = userContextService.getCurrentUser().email();
        return stagingReviewService.promoteAccepted(pipelineId, promotedBy);
    }

    private void assertTargetEntity(UUID pipelineId, TargetEntityType expected) {
        var dto = pipelineService.findById(pipelineId);
        if (dto.targetEntity() != expected) {
            throw new IllegalArgumentException(
                    "Pipeline target entity is " + dto.targetEntity() + ", not " + expected);
        }
    }
}
