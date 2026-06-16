ALTER TABLE atlas.integration_pipeline
    ADD COLUMN cron_expression  VARCHAR(100),
    ADD COLUMN schedule_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN next_execution_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN atlas.integration_pipeline.cron_expression   IS 'Quartz cron expression for automatic execution (null = no schedule)';
COMMENT ON COLUMN atlas.integration_pipeline.schedule_enabled  IS 'Whether the cron schedule is active';
COMMENT ON COLUMN atlas.integration_pipeline.next_execution_at IS 'Next scheduled execution time (maintained by Quartz listener)';
