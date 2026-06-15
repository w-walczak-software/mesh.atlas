-- Staging tables: receive raw/transformed data from Camel routes before promotion to business entities.
-- All business columns are nullable (external data may be partial).
-- Cleared per pipeline before each Camel run to reflect current source state.

-- ─── IT System staging ────────────────────────────────────────────────────────

CREATE TABLE atlas.staging_it_system
(
    id                       UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id              UUID         NOT NULL,
    external_id              VARCHAR(255),
    code                     VARCHAR(100),
    name                     VARCHAR(300),
    description              TEXT,
    documentation_url        TEXT,
    repository_url           TEXT,
    raw_status               VARCHAR(500),
    raw_lifecycle_stage      VARCHAR(500),
    raw_business_criticality VARCHAR(500),
    raw_data_classification  VARCHAR(500),
    raw_system_type          VARCHAR(500),
    raw_architecture_style   VARCHAR(500),
    raw_deployment_model     VARCHAR(500),
    raw_runtime_environment  VARCHAR(500),
    raw_scope                VARCHAR(500),
    icon                     VARCHAR(100),
    tags                     JSONB,
    metadata                 JSONB,
    staging_status           VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    error_message            TEXT,
    processed_at             TIMESTAMP,
    created_at               TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_staging_its_status
        CHECK (staging_status IN ('PENDING', 'SYNCED', 'ERROR', 'SKIPPED')),
    CONSTRAINT fk_staging_its_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id)
);

CREATE INDEX idx_staging_its_pipeline    ON atlas.staging_it_system (pipeline_id);
CREATE INDEX idx_staging_its_status      ON atlas.staging_it_system (staging_status);
CREATE INDEX idx_staging_its_ext_id      ON atlas.staging_it_system (external_id);

-- ─── API staging ──────────────────────────────────────────────────────────────

CREATE TABLE atlas.staging_api
(
    id                         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id                UUID         NOT NULL,
    external_id                VARCHAR(255),
    code                       VARCHAR(100),
    name                       VARCHAR(300),
    description                TEXT,
    api_version                VARCHAR(100),
    documentation_url          TEXT,
    contract_url               TEXT,
    raw_type                   VARCHAR(500),
    raw_status                 VARCHAR(500),
    raw_protocol               VARCHAR(500),
    raw_authentication_method  VARCHAR(500),
    raw_integration_pattern    VARCHAR(500),
    raw_data_flow_direction    VARCHAR(500),
    raw_message_format         VARCHAR(500),
    tags                       JSONB,
    staging_status             VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    error_message              TEXT,
    processed_at               TIMESTAMP,
    created_at                 TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_staging_api_status
        CHECK (staging_status IN ('PENDING', 'SYNCED', 'ERROR', 'SKIPPED')),
    CONSTRAINT fk_staging_api_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id)
);

CREATE INDEX idx_staging_api_pipeline  ON atlas.staging_api (pipeline_id);
CREATE INDEX idx_staging_api_status    ON atlas.staging_api (staging_status);
CREATE INDEX idx_staging_api_ext_id    ON atlas.staging_api (external_id);

-- ─── Data Domain staging ──────────────────────────────────────────────────────

CREATE TABLE atlas.staging_data_domain
(
    id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id       UUID         NOT NULL,
    external_id       VARCHAR(255),
    code              VARCHAR(100),
    name              VARCHAR(300),
    description       TEXT,
    documentation_url TEXT,
    raw_group         VARCHAR(500),
    tags              JSONB,
    metadata          JSONB,
    staging_status    VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    error_message     TEXT,
    processed_at      TIMESTAMP,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_staging_dd_status
        CHECK (staging_status IN ('PENDING', 'SYNCED', 'ERROR', 'SKIPPED')),
    CONSTRAINT fk_staging_dd_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id)
);

CREATE INDEX idx_staging_dd_pipeline  ON atlas.staging_data_domain (pipeline_id);
CREATE INDEX idx_staging_dd_status    ON atlas.staging_data_domain (staging_status);
CREATE INDEX idx_staging_dd_ext_id    ON atlas.staging_data_domain (external_id);
