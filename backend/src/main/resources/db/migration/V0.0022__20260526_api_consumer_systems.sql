-- ============================================================================
-- V0.0022__20260526_api_consumer_systems.sql
-- API: Producer/Consumer model refactoring
--   - Rename source_system_id → producer_system_id (single producer)
--   - Replace single target_system_id with api_consumer_system join table (many consumers)
--   - Add data_flow_direction_id (PULL / PUSH dictionary)
--   - Audit join table for consumer system tracking
-- ============================================================================

-- ── 1. DATA_FLOW_DIRECTION dictionary type ────────────────────────────────
INSERT INTO dictionary_type (id, code, name, description, system_defined, active, created_at, created_by)
VALUES (
    gen_random_uuid(),
    'DATA_FLOW_DIRECTION',
    'Data Flow Direction',
    'Direction of data flow between producer and consumer systems in an API integration',
    TRUE, TRUE, now(), 'system'
);

INSERT INTO dictionary_entry (id, dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT gen_random_uuid(), dt.id, v.code, v.name, v.description, v.display_order, TRUE, TRUE, now(), 'system'
FROM dictionary_type dt
CROSS JOIN (
    VALUES
        ('PULL', 'Pull (Producer → Consumer)',
         'Consumer pulls / reads data from the producer (classic request-response, polling)', 1),
        ('PUSH', 'Push (Consumer → Producer)',
         'Consumer pushes / sends data to the producer (callbacks, webhooks, event publishing)', 2)
) AS v(code, name, description, display_order)
WHERE dt.code = 'DATA_FLOW_DIRECTION';

-- ── 2. Rename source_system_id → producer_system_id in atlas.api ──────────

ALTER TABLE atlas.api RENAME COLUMN source_system_id TO producer_system_id;
ALTER TABLE atlas.api RENAME CONSTRAINT fk_api_source_system TO fk_api_producer_system;
DROP INDEX IF EXISTS atlas.idx_api_source_system_id;
CREATE INDEX idx_api_producer_system_id ON atlas.api (producer_system_id);

-- ── 3. Add data_flow_direction_id to atlas.api ────────────────────────────

ALTER TABLE atlas.api ADD COLUMN data_flow_direction_id UUID;
ALTER TABLE atlas.api
    ADD CONSTRAINT fk_api_data_flow_direction
        FOREIGN KEY (data_flow_direction_id) REFERENCES dictionary_entry (id);
CREATE INDEX idx_api_data_flow_direction_id ON atlas.api (data_flow_direction_id);

-- ── 4. Create api_consumer_system junction table ──────────────────────────

CREATE TABLE atlas.api_consumer_system (
    api_id       UUID NOT NULL,
    it_system_id UUID NOT NULL,

    CONSTRAINT pk_api_consumer_system
        PRIMARY KEY (api_id, it_system_id),
    CONSTRAINT fk_acs_api
        FOREIGN KEY (api_id) REFERENCES atlas.api (id) ON DELETE CASCADE,
    CONSTRAINT fk_acs_it_system
        FOREIGN KEY (it_system_id) REFERENCES it_system (id) ON DELETE CASCADE
);

CREATE INDEX idx_api_consumer_system_api_id      ON atlas.api_consumer_system (api_id);
CREATE INDEX idx_api_consumer_system_it_system_id ON atlas.api_consumer_system (it_system_id);

-- ── 5. Migrate existing target_system_id data to api_consumer_system ──────

INSERT INTO atlas.api_consumer_system (api_id, it_system_id)
SELECT id, target_system_id
FROM atlas.api
WHERE target_system_id IS NOT NULL;

-- ── 6. Remove target_system_id from atlas.api ─────────────────────────────

ALTER TABLE atlas.api DROP CONSTRAINT IF EXISTS fk_api_target_system;
DROP INDEX IF EXISTS atlas.idx_api_target_system_id;
ALTER TABLE atlas.api DROP COLUMN IF EXISTS target_system_id;

-- ── 7. Update aud.api_aud to mirror the entity changes ────────────────────

ALTER TABLE aud.api_aud RENAME COLUMN source_system_id TO producer_system_id;
ALTER TABLE aud.api_aud DROP COLUMN IF EXISTS target_system_id;
ALTER TABLE aud.api_aud ADD COLUMN data_flow_direction_id UUID;

-- ── 8. Create aud.api_consumer_system_aud for Envers join table audit ─────

CREATE TABLE aud.api_consumer_system_aud (
    api_id       UUID     NOT NULL,
    it_system_id UUID     NOT NULL,
    rev          BIGINT   NOT NULL,
    revtype      SMALLINT NOT NULL,

    CONSTRAINT pk_api_consumer_system_aud
        PRIMARY KEY (api_id, it_system_id, rev),
    CONSTRAINT fk_api_consumer_system_aud_rev
        FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_api_consumer_system_aud_rev ON aud.api_consumer_system_aud (rev);
