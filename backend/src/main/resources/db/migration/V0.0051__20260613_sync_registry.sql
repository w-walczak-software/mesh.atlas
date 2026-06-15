-- Sync registry: audit trail for every integration synchronization run.
-- sync_registry: one row per pipeline execution.
-- sync_registry_item: one row per promoted business entity within that run.

CREATE TABLE atlas.sync_registry
(
    id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id    UUID         NOT NULL,
    status         VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    executed_by    VARCHAR(100) NOT NULL,
    executed_at    TIMESTAMP    NOT NULL DEFAULT now(),
    completed_at   TIMESTAMP,
    total_count    INTEGER      NOT NULL DEFAULT 0,
    success_count  INTEGER      NOT NULL DEFAULT 0,
    failed_count   INTEGER      NOT NULL DEFAULT 0,
    skipped_count  INTEGER      NOT NULL DEFAULT 0,
    execution_log  TEXT,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    created_by     VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),

    CONSTRAINT chk_sync_registry_status
        CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL')),
    CONSTRAINT fk_sync_registry_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id)
);

CREATE INDEX idx_sync_reg_pipeline    ON atlas.sync_registry (pipeline_id);
CREATE INDEX idx_sync_reg_status      ON atlas.sync_registry (status);
CREATE INDEX idx_sync_reg_executed_at ON atlas.sync_registry (executed_at DESC);

-- ─── Per-item results ─────────────────────────────────────────────────────────

CREATE TABLE atlas.sync_registry_item
(
    id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_registry_id UUID         NOT NULL,
    entity_type      VARCHAR(30)  NOT NULL,
    external_id      VARCHAR(255),
    target_id        UUID,
    action           VARCHAR(30)  NOT NULL,
    status           VARCHAR(30)  NOT NULL,
    error_message    TEXT,
    created_at       TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_sri_entity_type
        CHECK (entity_type IN ('IT_SYSTEM', 'API', 'DATA_DOMAIN')),
    CONSTRAINT chk_sri_action
        CHECK (action IN ('CREATE', 'UPDATE', 'SKIP')),
    CONSTRAINT chk_sri_status
        CHECK (status IN ('SYNCED', 'ERROR', 'SKIPPED')),
    CONSTRAINT fk_sri_sync_registry
        FOREIGN KEY (sync_registry_id) REFERENCES atlas.sync_registry (id) ON DELETE CASCADE
);

CREATE INDEX idx_sri_sync_registry ON atlas.sync_registry_item (sync_registry_id);
CREATE INDEX idx_sri_entity_type   ON atlas.sync_registry_item (entity_type);
CREATE INDEX idx_sri_status        ON atlas.sync_registry_item (status);
