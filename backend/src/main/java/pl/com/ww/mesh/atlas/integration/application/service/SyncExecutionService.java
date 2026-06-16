package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.integration.application.dto.SyncTriggerDto;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationPipelineNotActiveException;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationSyncAlreadyRunningException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingApiEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingDataDomainEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingItSystemEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncAction;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncRegistryItemEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.camel.CamelSyncEngine;
import pl.com.ww.mesh.atlas.integration.infrastructure.camel.SyncExecutionResult;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingApiRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingDataDomainRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.StagingItSystemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryItemRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterEntity;
import pl.com.ww.mesh.atlas.systemparameter.infrastructure.persistence.SystemParameterRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SyncExecutionService {

    private final IntegrationPipelineService pipelineService;
    private final SyncRegistryRepository syncRegistryRepository;
    private final SyncRegistryItemRepository syncRegistryItemRepository;
    private final StagingItSystemRepository stagingItSystemRepository;
    private final StagingApiRepository stagingApiRepository;
    private final StagingDataDomainRepository stagingDataDomainRepository;
    private final ItSystemRepository itSystemRepository;
    private final ApiRepository apiRepository;
    private final DataDomainRepository dataDomainRepository;
    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final CamelSyncEngine camelSyncEngine;
    private final SystemParameterRepository systemParameterRepository;
    private final SyncReportEmailService syncReportEmailService;

    @Transactional
    public SyncTriggerDto triggerSync(UUID pipelineId, String executedBy) {
        IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);

        if (pipeline.getStatus() != PipelineStatus.ACTIVE) {
            throw new IntegrationPipelineNotActiveException(pipeline.getCode());
        }
        if (syncRegistryRepository.existsByPipelineIdAndStatusIn(pipelineId,
                List.of(SyncStatus.PENDING, SyncStatus.RUNNING, SyncStatus.PENDING_REVIEW))) {
            throw new IntegrationSyncAlreadyRunningException(pipelineId);
        }

        clearStaging(pipeline);

        SyncRegistryEntity registry = SyncRegistryEntity.builder()
                .pipeline(pipeline)
                .status(SyncStatus.PENDING)
                .executedBy(executedBy)
                .executedAt(LocalDateTime.now())
                .build();
        registry = syncRegistryRepository.save(registry);

        UUID registryId = registry.getId();
        executeAsync(pipelineId, registryId);

        return new SyncTriggerDto(registryId, "Synchronization started");
    }

    @Async
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void executeAsync(UUID pipelineId, UUID registryId) {
        try {
            updateStatus(registryId, SyncStatus.RUNNING);
            IntegrationPipelineEntity pipeline = pipelineService.load(pipelineId);

            SyncExecutionResult camelResult = camelSyncEngine.execute(pipeline, registryId);

            if (!camelResult.success()) {
                log.error("Camel execution failed for pipeline {}: {}", pipeline.getCode(), camelResult.errorDetails());
                finishRegistry(registryId, SyncStatus.FAILED, camelResult.log() + "\nERROR: " + camelResult.errorDetails());
                syncReportEmailService.sendSyncReport(registryId);
                return;
            }

            boolean autoPromote = systemParameterRepository
                    .findByParameterKey("SYNC_AUTO_PROMOTE")
                    .map(SystemParameterEntity::getBooleanValue)
                    .filter(v -> v != null)
                    .orElse(true);

            if (autoPromote) {
                promoteAllStaging(pipeline, registryId);
                recalculateCounts(registryId, camelResult.log());
                syncReportEmailService.sendSyncReport(registryId);
            } else {
                long pendingCount = countPendingStaging(pipeline);
                setPendingReview(registryId, pendingCount, camelResult.log());
            }

        } catch (Exception e) {
            log.error("Sync execution error for registry {}", registryId, e);
            finishRegistry(registryId, SyncStatus.FAILED, "Unexpected error: " + e.getMessage());
            syncReportEmailService.sendSyncReport(registryId);
        }
    }

    private void promoteAllStaging(IntegrationPipelineEntity pipeline, UUID registryId) {
        switch (pipeline.getTargetEntity()) {
            case IT_SYSTEM -> stagingItSystemRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING)
                    .forEach(row -> promoteItSystem(row, pipeline, registryId));
            case API -> stagingApiRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING)
                    .forEach(row -> promoteApi(row, pipeline, registryId));
            case DATA_DOMAIN -> stagingDataDomainRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING)
                    .forEach(row -> promoteDataDomain(row, pipeline, registryId));
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void promoteItSystem(StagingItSystemEntity row, IntegrationPipelineEntity pipeline, UUID registryId) {
        SyncRegistryEntity registry = syncRegistryRepository.getReferenceById(registryId);
        try {
            Optional<ItSystemEntity> existing = row.getExternalId() != null
                    ? itSystemRepository.findByExternalId(row.getExternalId())
                    : Optional.empty();

            SyncAction action = existing.isPresent() ? SyncAction.UPDATE : SyncAction.CREATE;
            ItSystemEntity entity = existing.orElseGet(ItSystemEntity::new);

            if (row.getName() != null) entity.setName(row.getName());
            if (row.getDescription() != null) entity.setDescription(row.getDescription());
            if (row.getDocumentationUrl() != null) entity.setDocumentationUrl(row.getDocumentationUrl());
            if (row.getRepositoryUrl() != null) entity.setRepositoryUrl(row.getRepositoryUrl());
            if (row.getIcon() != null) entity.setIcon(row.getIcon());
            if (row.getTags() != null) entity.setTags(row.getTags());
            if (row.getMetadata() != null) entity.setMetadata(row.getMetadata());
            entity.setSource(pipeline.getCode());

            if (action == SyncAction.CREATE) {
                if (row.getCode() == null) {
                    throw new IllegalStateException("Code is required for CREATE");
                }
                entity.setCode(row.getCode());
                entity.setExternalId(row.getExternalId());
                entity.setActive(true);
            }

            applyItSystemDictionaries(row, entity, pipeline);
            entity = itSystemRepository.save(entity);

            markStagingSynced(row);
            addRegistryItem(registry, TargetEntityType.IT_SYSTEM, row.getExternalId(), entity.getId(), action, StagingStatus.SYNCED, null);
        } catch (Exception e) {
            log.warn("Failed to promote IT system staging row {}: {}", row.getId(), e.getMessage());
            markStagingError(row, e.getMessage());
            addRegistryItem(registry, TargetEntityType.IT_SYSTEM, row.getExternalId(), null, SyncAction.CREATE, StagingStatus.ERROR, e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void promoteApi(StagingApiEntity row, IntegrationPipelineEntity pipeline, UUID registryId) {
        SyncRegistryEntity registry = syncRegistryRepository.getReferenceById(registryId);
        try {
            Optional<ApiEntity> existing = row.getExternalId() != null
                    ? apiRepository.findByExternalId(row.getExternalId())
                    : Optional.empty();

            SyncAction action = existing.isPresent() ? SyncAction.UPDATE : SyncAction.CREATE;
            ApiEntity entity = existing.orElseGet(ApiEntity::new);

            if (row.getName() != null) entity.setName(row.getName());
            if (row.getDescription() != null) entity.setDescription(row.getDescription());
            if (row.getApiVersion() != null) entity.setApiVersion(row.getApiVersion());
            if (row.getDocumentationUrl() != null) entity.setDocumentationUrl(row.getDocumentationUrl());
            if (row.getContractUrl() != null) entity.setContractUrl(row.getContractUrl());
            if (row.getTags() != null) entity.setTags(row.getTags());
            entity.setSource(pipeline.getCode());

            if (action == SyncAction.CREATE) {
                if (row.getCode() == null) throw new IllegalStateException("Code is required for CREATE");
                entity.setCode(row.getCode());
                entity.setExternalId(row.getExternalId());
                entity.setActive(true);
            }

            entity = apiRepository.save(entity);
            markStagingSynced(row);
            addRegistryItem(registry, TargetEntityType.API, row.getExternalId(), entity.getId(), action, StagingStatus.SYNCED, null);
        } catch (Exception e) {
            log.warn("Failed to promote API staging row {}: {}", row.getId(), e.getMessage());
            markStagingError(row, e.getMessage());
            addRegistryItem(registry, TargetEntityType.API, row.getExternalId(), null, SyncAction.CREATE, StagingStatus.ERROR, e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void promoteDataDomain(StagingDataDomainEntity row, IntegrationPipelineEntity pipeline, UUID registryId) {
        SyncRegistryEntity registry = syncRegistryRepository.getReferenceById(registryId);
        try {
            Optional<DataDomainEntity> existing = row.getCode() != null
                    ? dataDomainRepository.findByCode(row.getCode())
                    : Optional.empty();

            SyncAction action = existing.isPresent() ? SyncAction.UPDATE : SyncAction.CREATE;
            DataDomainEntity entity = existing.orElseGet(DataDomainEntity::new);

            if (row.getName() != null) entity.setName(row.getName());
            if (row.getDescription() != null) entity.setDescription(row.getDescription());
            if (row.getDocumentationUrl() != null) entity.setDocumentationUrl(row.getDocumentationUrl());
            if (row.getTags() != null) entity.setTags(row.getTags());
            if (row.getMetadata() != null) entity.setMetadata(row.getMetadata());
            entity.setSource(pipeline.getCode());

            if (action == SyncAction.CREATE) {
                if (row.getCode() == null) throw new IllegalStateException("Code is required for CREATE");
                entity.setCode(row.getCode());
                entity.setActive(true);
            }

            entity = dataDomainRepository.save(entity);
            markStagingSynced(row);
            addRegistryItem(registry, TargetEntityType.DATA_DOMAIN, row.getExternalId(), entity.getId(), action, StagingStatus.SYNCED, null);
        } catch (Exception e) {
            log.warn("Failed to promote DataDomain staging row {}: {}", row.getId(), e.getMessage());
            markStagingError(row, e.getMessage());
            addRegistryItem(registry, TargetEntityType.DATA_DOMAIN, row.getExternalId(), null, SyncAction.CREATE, StagingStatus.ERROR, e.getMessage());
        }
    }

    private void applyItSystemDictionaries(StagingItSystemEntity row, ItSystemEntity entity,
                                            IntegrationPipelineEntity pipeline) {
        if (row.getRawStatus() != null && entity.getStatus() == null) {
            lookupEntry(row.getRawStatus(), "SYSTEM_STATUS").ifPresent(entity::setStatus);
        }
        if (row.getRawLifecycleStage() != null && entity.getLifecycleStage() == null) {
            lookupEntry(row.getRawLifecycleStage(), "LIFECYCLE_STAGE").ifPresent(entity::setLifecycleStage);
        }
        if (row.getRawBusinessCriticality() != null && entity.getBusinessCriticality() == null) {
            lookupEntry(row.getRawBusinessCriticality(), "BUSINESS_CRITICALITY").ifPresent(entity::setBusinessCriticality);
        }
        if (row.getRawDataClassification() != null && entity.getDataClassification() == null) {
            lookupEntry(row.getRawDataClassification(), "DATA_CLASSIFICATION").ifPresent(entity::setDataClassification);
        }
        if (row.getRawSystemType() != null && entity.getSystemType() == null) {
            lookupEntry(row.getRawSystemType(), "SYSTEM_TYPE").ifPresent(entity::setSystemType);
        }
    }

    private Optional<DictionaryEntryEntity> lookupEntry(String code, String typeCode) {
        return dictionaryEntryRepository.findFirstByDictionaryTypeCodeAndCodeIgnoreCaseAndActiveTrue(typeCode, code);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSynced(StagingItSystemEntity row) {
        row.setStagingStatus(StagingStatus.SYNCED);
        row.setProcessedAt(LocalDateTime.now());
        stagingItSystemRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSynced(StagingApiEntity row) {
        row.setStagingStatus(StagingStatus.SYNCED);
        row.setProcessedAt(LocalDateTime.now());
        stagingApiRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSynced(StagingDataDomainEntity row) {
        row.setStagingStatus(StagingStatus.SYNCED);
        row.setProcessedAt(LocalDateTime.now());
        stagingDataDomainRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingError(StagingItSystemEntity row, String message) {
        row.setStagingStatus(StagingStatus.ERROR);
        row.setErrorMessage(message);
        stagingItSystemRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingError(StagingApiEntity row, String message) {
        row.setStagingStatus(StagingStatus.ERROR);
        row.setErrorMessage(message);
        stagingApiRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingError(StagingDataDomainEntity row, String message) {
        row.setStagingStatus(StagingStatus.ERROR);
        row.setErrorMessage(message);
        stagingDataDomainRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void addRegistryItem(SyncRegistryEntity registry, TargetEntityType type, String externalId,
                                 UUID targetId, SyncAction action, StagingStatus status, String error) {
        syncRegistryItemRepository.save(SyncRegistryItemEntity.builder()
                .syncRegistry(registry)
                .entityType(type)
                .externalId(externalId)
                .targetId(targetId)
                .action(action)
                .status(status)
                .errorMessage(error)
                .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStatus(UUID registryId, SyncStatus status) {
        syncRegistryRepository.findById(registryId).ifPresent(r -> {
            r.setStatus(status);
            syncRegistryRepository.save(r);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishRegistry(UUID registryId, SyncStatus status, String log) {
        syncRegistryRepository.findById(registryId).ifPresent(r -> {
            r.setStatus(status);
            r.setCompletedAt(LocalDateTime.now());
            r.setExecutionLog(log);
            syncRegistryRepository.save(r);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recalculateCounts(UUID registryId, String camelLog) {
        syncRegistryRepository.findById(registryId).ifPresent(r -> {
            long success = syncRegistryItemRepository.countBySyncRegistryIdAndStatus(registryId, StagingStatus.SYNCED);
            long failed = syncRegistryItemRepository.countBySyncRegistryIdAndStatus(registryId, StagingStatus.ERROR);
            long skipped = syncRegistryItemRepository.countBySyncRegistryIdAndStatus(registryId, StagingStatus.SKIPPED);
            long total = success + failed + skipped;

            r.setTotalCount((int) total);
            r.setSuccessCount((int) success);
            r.setFailedCount((int) failed);
            r.setSkippedCount((int) skipped);
            r.setCompletedAt(LocalDateTime.now());
            r.setExecutionLog(camelLog);

            if (failed == 0) {
                r.setStatus(SyncStatus.COMPLETED);
            } else if (success > 0) {
                r.setStatus(SyncStatus.PARTIAL);
            } else {
                r.setStatus(SyncStatus.FAILED);
            }
            syncRegistryRepository.save(r);
        });
    }

    @Transactional
    public void clearStaging(IntegrationPipelineEntity pipeline) {
        switch (pipeline.getTargetEntity()) {
            case IT_SYSTEM -> stagingItSystemRepository.deleteAllByPipelineId(pipeline.getId());
            case API -> stagingApiRepository.deleteAllByPipelineId(pipeline.getId());
            case DATA_DOMAIN -> stagingDataDomainRepository.deleteAllByPipelineId(pipeline.getId());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSkipped(StagingItSystemEntity row) {
        row.setStagingStatus(StagingStatus.SKIPPED);
        stagingItSystemRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSkipped(StagingApiEntity row) {
        row.setStagingStatus(StagingStatus.SKIPPED);
        stagingApiRepository.save(row);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markStagingSkipped(StagingDataDomainEntity row) {
        row.setStagingStatus(StagingStatus.SKIPPED);
        stagingDataDomainRepository.save(row);
    }

    private long countPendingStaging(IntegrationPipelineEntity pipeline) {
        return switch (pipeline.getTargetEntity()) {
            case IT_SYSTEM -> stagingItSystemRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING).size();
            case API -> stagingApiRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING).size();
            case DATA_DOMAIN -> stagingDataDomainRepository
                    .findAllByPipelineIdAndStagingStatus(pipeline.getId(), StagingStatus.PENDING).size();
        };
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void setPendingReview(UUID registryId, long pendingCount, String camelLog) {
        syncRegistryRepository.findById(registryId).ifPresent(r -> {
            r.setStatus(SyncStatus.PENDING_REVIEW);
            r.setTotalCount((int) pendingCount);
            r.setExecutionLog(camelLog);
            syncRegistryRepository.save(r);
        });
    }
}
