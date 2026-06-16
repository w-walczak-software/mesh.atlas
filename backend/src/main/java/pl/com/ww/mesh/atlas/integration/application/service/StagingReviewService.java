package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingPromoteResultDto;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationNoPendingReviewException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncAction;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingApiRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingDataDomainRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingItSystemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class StagingReviewService {

    private final IntegrationPipelineService pipelineService;
    private final SyncRegistryRepository syncRegistryRepository;
    private final StagingItSystemRepository stagingItSystemRepository;
    private final StagingApiRepository stagingApiRepository;
    private final StagingDataDomainRepository stagingDataDomainRepository;
    private final SyncExecutionService syncExecutionService;
    private final SyncReportEmailService syncReportEmailService;

    @Transactional
    public void acceptItems(UUID pipelineId, List<UUID> ids) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);
        updateStagingStatus(pipeline.getTargetEntity(), pipelineId, ids, StagingStatus.ACCEPTED);
    }

    @Transactional
    public void rejectItems(UUID pipelineId, List<UUID> ids) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);
        updateStagingStatus(pipeline.getTargetEntity(), pipelineId, ids, StagingStatus.REJECTED);
    }

    private void updateStagingStatus(TargetEntityType targetEntity, UUID pipelineId,
                                      List<UUID> ids, StagingStatus newStatus) {
        switch (targetEntity) {
            case IT_SYSTEM -> stagingItSystemRepository.findAllByIdInAndPipelineId(ids, pipelineId)
                    .stream()
                    .filter(row -> row.getStagingStatus() == StagingStatus.PENDING
                            || row.getStagingStatus() == StagingStatus.ACCEPTED
                            || row.getStagingStatus() == StagingStatus.REJECTED)
                    .forEach(row -> {
                        row.setStagingStatus(newStatus);
                        stagingItSystemRepository.save(row);
                    });
            case API -> stagingApiRepository.findAllByIdInAndPipelineId(ids, pipelineId)
                    .stream()
                    .filter(row -> row.getStagingStatus() == StagingStatus.PENDING
                            || row.getStagingStatus() == StagingStatus.ACCEPTED
                            || row.getStagingStatus() == StagingStatus.REJECTED)
                    .forEach(row -> {
                        row.setStagingStatus(newStatus);
                        stagingApiRepository.save(row);
                    });
            case DATA_DOMAIN -> stagingDataDomainRepository.findAllByIdInAndPipelineId(ids, pipelineId)
                    .stream()
                    .filter(row -> row.getStagingStatus() == StagingStatus.PENDING
                            || row.getStagingStatus() == StagingStatus.ACCEPTED
                            || row.getStagingStatus() == StagingStatus.REJECTED)
                    .forEach(row -> {
                        row.setStagingStatus(newStatus);
                        stagingDataDomainRepository.save(row);
                    });
        }
    }

    @Transactional
    public StagingPromoteResultDto promoteAccepted(UUID pipelineId, String promotedBy) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);

        SyncRegistryEntity registry = syncRegistryRepository
                .findFirstByPipelineIdAndStatusOrderByExecutedAtDesc(pipelineId, SyncStatus.PENDING_REVIEW)
                .orElseThrow(() -> new IntegrationNoPendingReviewException(pipelineId));

        UUID registryId = registry.getId();
        AtomicInteger promoted = new AtomicInteger(0);
        AtomicInteger rejected = new AtomicInteger(0);
        AtomicInteger failed = new AtomicInteger(0);

        switch (pipeline.getTargetEntity()) {
            case IT_SYSTEM -> {
                stagingItSystemRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ACCEPTED)
                        .forEach(row -> {
                            syncExecutionService.promoteItSystem(row, pipeline, registryId);
                            promoted.incrementAndGet();
                        });
                stagingItSystemRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.REJECTED)
                        .forEach(row -> {
                            syncExecutionService.addRegistryItem(registry, TargetEntityType.IT_SYSTEM,
                                    row.getExternalId(), null, SyncAction.SKIP, StagingStatus.SKIPPED, "Rejected by user");
                            syncExecutionService.markStagingSkipped(row);
                            rejected.incrementAndGet();
                        });
                failed.addAndGet((int) stagingItSystemRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ERROR).size());
            }
            case API -> {
                stagingApiRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ACCEPTED)
                        .forEach(row -> {
                            syncExecutionService.promoteApi(row, pipeline, registryId);
                            promoted.incrementAndGet();
                        });
                stagingApiRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.REJECTED)
                        .forEach(row -> {
                            syncExecutionService.addRegistryItem(registry, TargetEntityType.API,
                                    row.getExternalId(), null, SyncAction.SKIP, StagingStatus.SKIPPED, "Rejected by user");
                            syncExecutionService.markStagingSkipped(row);
                            rejected.incrementAndGet();
                        });
                failed.addAndGet((int) stagingApiRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ERROR).size());
            }
            case DATA_DOMAIN -> {
                stagingDataDomainRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ACCEPTED)
                        .forEach(row -> {
                            syncExecutionService.promoteDataDomain(row, pipeline, registryId);
                            promoted.incrementAndGet();
                        });
                stagingDataDomainRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.REJECTED)
                        .forEach(row -> {
                            syncExecutionService.addRegistryItem(registry, TargetEntityType.DATA_DOMAIN,
                                    row.getExternalId(), null, SyncAction.SKIP, StagingStatus.SKIPPED, "Rejected by user");
                            syncExecutionService.markStagingSkipped(row);
                            rejected.incrementAndGet();
                        });
                failed.addAndGet((int) stagingDataDomainRepository
                        .findAllByPipelineIdAndStagingStatus(pipelineId, StagingStatus.ERROR).size());
            }
        }

        syncExecutionService.recalculateCounts(registryId, registry.getExecutionLog());
        syncReportEmailService.sendSyncReport(registryId);

        log.info("Promoted {} accepted, {} rejected, {} failed for pipeline {}",
                promoted.get(), rejected.get(), failed.get(), pipelineId);

        return new StagingPromoteResultDto(promoted.get(), rejected.get(), failed.get());
    }
}
