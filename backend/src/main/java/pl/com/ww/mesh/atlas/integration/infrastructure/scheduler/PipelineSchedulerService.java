package pl.com.ww.mesh.atlas.integration.infrastructure.scheduler;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.SyncStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.IntegrationPipelineRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.SyncRegistryRepository;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineSchedulerService {

    static final String JOB_GROUP = "PIPELINE_SYNC";
    private static final int ORDERING_WAIT_MAX_MINUTES = 30;
    private static final int ORDERING_POLL_INTERVAL_SECONDS = 30;

    private final Scheduler scheduler;
    private final IntegrationPipelineRepository pipelineRepository;
    private final SyncRegistryRepository syncRegistryRepository;

    @PostConstruct
    public void rescheduleAllOnStartup() {
        log.info("Rescheduling all active pipeline schedules after startup...");
        int page = 0;
        Page<IntegrationPipelineEntity> batch;
        do {
            batch = pipelineRepository.findAll(PageRequest.of(page++, 50));
            batch.getContent().stream()
                    .filter(p -> p.isActive() && p.isScheduleEnabled()
                            && p.getCronExpression() != null && !p.getCronExpression().isBlank()
                            && p.getStatus() == PipelineStatus.ACTIVE)
                    .forEach(p -> {
                        try {
                            Instant nextAt = scheduleOrUpdate(p);
                            if (nextAt != null && !nextAt.equals(p.getNextExecutionAt())) {
                                persistNextExecutionAt(p.getId(), nextAt);
                            }
                        } catch (Exception e) {
                            log.warn("Failed to reschedule pipeline {} on startup: {}", p.getCode(), e.getMessage());
                        }
                    });
        } while (batch.hasNext());
        log.info("Pipeline reschedule complete.");
    }

    /**
     * Schedules or updates the Quartz job for the given pipeline.
     * Returns the next computed fire time (or null if schedule was removed).
     * The caller is responsible for persisting the returned value to the entity.
     */
    public Instant scheduleOrUpdate(IntegrationPipelineEntity pipeline) {
        if (!pipeline.isScheduleEnabled()
                || pipeline.getCronExpression() == null
                || pipeline.getCronExpression().isBlank()
                || pipeline.getStatus() != PipelineStatus.ACTIVE
                || !pipeline.isActive()) {
            removeJobIfExists(pipeline.getId());
            return null;
        }

        JobKey jobKey = jobKeyFor(pipeline.getId());
        TriggerKey triggerKey = triggerKeyFor(pipeline.getId());
        int priority = priorityFor(pipeline.getTargetEntity());

        try {
            JobDetail job = JobBuilder.newJob(ScheduledPipelineSyncJob.class)
                    .withIdentity(jobKey)
                    .withDescription(pipeline.getName())
                    .usingJobData("pipelineId", pipeline.getId().toString())
                    .storeDurably()
                    .build();

            CronTrigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .forJob(jobKey)
                    .withPriority(priority)
                    .withSchedule(CronScheduleBuilder
                            .cronSchedule(pipeline.getCronExpression())
                            .withMisfireHandlingInstructionDoNothing())
                    .build();

            if (scheduler.checkExists(jobKey)) {
                scheduler.addJob(job, true);
                scheduler.rescheduleJob(triggerKey, trigger);
            } else {
                scheduler.scheduleJob(job, trigger);
            }

            Date nextFire = trigger.getFireTimeAfter(new Date());
            Instant nextAt = nextFire != null ? nextFire.toInstant() : null;
            log.info("Scheduled pipeline {} with cron '{}', next fire: {}", pipeline.getCode(), pipeline.getCronExpression(), nextAt);
            return nextAt;
        } catch (SchedulerException e) {
            log.error("Failed to schedule pipeline {}: {}", pipeline.getCode(), e.getMessage(), e);
            return null;
        }
    }

    /**
     * Removes the Quartz job for the given pipeline (no DB entity update).
     */
    public void removeJobIfExists(UUID pipelineId) {
        JobKey jobKey = jobKeyFor(pipelineId);
        try {
            if (scheduler.checkExists(jobKey)) {
                scheduler.deleteJob(jobKey);
                log.info("Removed schedule for pipeline {}", pipelineId);
            }
        } catch (SchedulerException e) {
            log.warn("Failed to remove schedule for pipeline {}: {}", pipelineId, e.getMessage());
        }
    }

    /**
     * Called from ScheduledPipelineSyncJob to enforce entity-type execution order.
     * IT_SYSTEM must wait for any running DATA_DOMAIN syncs.
     * API must wait for any running DATA_DOMAIN or IT_SYSTEM syncs.
     */
    public void waitForPrerequisites(TargetEntityType entityType) {
        List<TargetEntityType> prerequisites = switch (entityType) {
            case IT_SYSTEM -> List.of(TargetEntityType.DATA_DOMAIN);
            case API -> List.of(TargetEntityType.DATA_DOMAIN, TargetEntityType.IT_SYSTEM);
            case DATA_DOMAIN -> List.of();
        };

        if (prerequisites.isEmpty()) return;

        List<SyncStatus> activeStatuses = List.of(SyncStatus.PENDING, SyncStatus.RUNNING);
        int maxPolls = (ORDERING_WAIT_MAX_MINUTES * 60) / ORDERING_POLL_INTERVAL_SECONDS;

        for (TargetEntityType prereq : prerequisites) {
            for (int i = 0; i < maxPolls; i++) {
                boolean running = syncRegistryRepository.existsRunningByTargetEntityType(prereq, activeStatuses);
                if (!running) break;
                if (i == maxPolls - 1) {
                    log.warn("Ordering wait timeout: {} sync still running after {} minutes — proceeding anyway.",
                            prereq, ORDERING_WAIT_MAX_MINUTES);
                    break;
                }
                log.debug("Waiting for {} syncs to finish before starting {} sync (poll {}/{})",
                        prereq, entityType, i + 1, maxPolls);
                try {
                    Thread.sleep(ORDERING_POLL_INTERVAL_SECONDS * 1000L);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }
    }

    /**
     * Called from ScheduledPipelineSyncJob after execution to refresh the stored next fire time.
     * Runs in its own transaction so it's not affected by the job's execution context.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refreshNextExecutionAt(UUID pipelineId) {
        TriggerKey triggerKey = triggerKeyFor(pipelineId);
        try {
            Instant nextAt = null;
            if (scheduler.checkExists(triggerKey)) {
                org.quartz.Trigger trigger = scheduler.getTrigger(triggerKey);
                nextAt = trigger != null && trigger.getNextFireTime() != null
                        ? trigger.getNextFireTime().toInstant()
                        : null;
            }
            persistNextExecutionAt(pipelineId, nextAt);
        } catch (SchedulerException e) {
            log.warn("Could not refresh next execution time for pipeline {}: {}", pipelineId, e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistNextExecutionAt(UUID pipelineId, Instant nextAt) {
        pipelineRepository.findById(pipelineId).ifPresent(p -> {
            p.setNextExecutionAt(nextAt);
            pipelineRepository.save(p);
        });
    }

    private static JobKey jobKeyFor(UUID pipelineId) {
        return JobKey.jobKey("pipeline-" + pipelineId, JOB_GROUP);
    }

    private static TriggerKey triggerKeyFor(UUID pipelineId) {
        return TriggerKey.triggerKey("pipeline-" + pipelineId, JOB_GROUP);
    }

    private static int priorityFor(TargetEntityType entityType) {
        return switch (entityType) {
            case DATA_DOMAIN -> 10;
            case IT_SYSTEM -> 5;
            case API -> 1;
        };
    }
}
