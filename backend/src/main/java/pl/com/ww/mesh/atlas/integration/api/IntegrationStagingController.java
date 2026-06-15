package pl.com.ww.mesh.atlas.integration.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingApiDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingDataDomainDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemDto;
import pl.com.ww.mesh.atlas.integration.application.service.IntegrationPipelineService;
import pl.com.ww.mesh.atlas.integration.application.service.StagingViewService;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integration/pipelines/{pipelineId}/staging")
@RequiredArgsConstructor
public class IntegrationStagingController {

    private final StagingViewService stagingViewService;
    private final IntegrationPipelineService pipelineService;

    @GetMapping("/it-systems")
    @IsAtlasAdmin
    public List<StagingItSystemDto> getItSystems(@PathVariable UUID pipelineId) {
        assertTargetEntity(pipelineId, TargetEntityType.IT_SYSTEM);
        return stagingViewService.findItSystemsByPipeline(pipelineId);
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

    private void assertTargetEntity(UUID pipelineId, TargetEntityType expected) {
        var dto = pipelineService.findById(pipelineId);
        if (dto.targetEntity() != expected) {
            throw new IllegalArgumentException(
                    "Pipeline target entity is " + dto.targetEntity() + ", not " + expected);
        }
    }
}
