package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingApiDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingDataDomainDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemOwnerDto;
import pl.com.ww.mesh.atlas.integration.application.mapper.StagingMapper;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingApiRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingDataDomainRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingItSystemOwnerRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingItSystemRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StagingViewService {

    private final StagingItSystemRepository stagingItSystemRepository;
    private final StagingItSystemOwnerRepository stagingItSystemOwnerRepository;
    private final StagingApiRepository stagingApiRepository;
    private final StagingDataDomainRepository stagingDataDomainRepository;
    private final StagingMapper stagingMapper;

    public List<StagingItSystemDto> findItSystemsByPipeline(UUID pipelineId) {
        return stagingItSystemRepository.findAllByPipelineId(pipelineId)
                .stream().map(stagingMapper::mapItSystem).toList();
    }

    public List<StagingItSystemOwnerDto> findItSystemOwnersByPipeline(UUID pipelineId) {
        return stagingItSystemOwnerRepository.findAllByPipelineId(pipelineId)
                .stream().map(stagingMapper::mapItSystemOwner).toList();
    }

    public List<StagingApiDto> findApisByPipeline(UUID pipelineId) {
        return stagingApiRepository.findAllByPipelineId(pipelineId)
                .stream().map(stagingMapper::mapApi).toList();
    }

    public List<StagingDataDomainDto> findDataDomainsByPipeline(UUID pipelineId) {
        return stagingDataDomainRepository.findAllByPipelineId(pipelineId)
                .stream().map(stagingMapper::mapDataDomain).toList();
    }
}
