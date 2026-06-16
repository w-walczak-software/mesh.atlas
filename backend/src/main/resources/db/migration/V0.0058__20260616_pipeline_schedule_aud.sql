-- Add schedule columns to Envers audit table for integration_pipeline.
-- next_execution_at is @NotAudited and is NOT added here.
ALTER TABLE aud.integration_pipeline_aud
    ADD COLUMN cron_expression  VARCHAR(100),
    ADD COLUMN schedule_enabled BOOLEAN;
