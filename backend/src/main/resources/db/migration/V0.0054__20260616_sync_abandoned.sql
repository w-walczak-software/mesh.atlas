-- Extend sync_registry.status CHECK to allow ABANDONED.
-- ABANDONED is set by an administrator to manually cancel a PENDING_REVIEW sync,
-- unblocking the pipeline for new synchronization runs.

ALTER TABLE atlas.sync_registry
    DROP CONSTRAINT chk_sync_registry_status;
ALTER TABLE atlas.sync_registry
    ADD CONSTRAINT chk_sync_registry_status
        CHECK (status IN ('PENDING', 'RUNNING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED', 'PARTIAL', 'ABANDONED'));
