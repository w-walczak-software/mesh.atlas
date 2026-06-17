-- Staging table for IT System owners synchronized via integration pipelines.
-- Owner rows are linked to staging_it_system via system_external_id (external ID of the target IT System).
-- On promotion, existing owners of the target IT System are replaced by the staged rows (REPLACE strategy).

CREATE TABLE atlas.staging_it_system_owner
(
    id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id        UUID         NOT NULL,
    system_external_id VARCHAR(255) NOT NULL,
    external_id        VARCHAR(255),
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    email              VARCHAR(200) NOT NULL,
    raw_role           VARCHAR(500),
    valid_from         DATE,
    valid_to           DATE,
    staging_status     VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    error_message      TEXT,
    processed_at       TIMESTAMP,
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),

    CONSTRAINT chk_staging_its_owner_status
        CHECK (staging_status IN ('PENDING', 'SYNCED', 'ERROR', 'SKIPPED')),
    CONSTRAINT fk_staging_its_owner_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id)
);

CREATE INDEX idx_staging_its_owner_pipeline    ON atlas.staging_it_system_owner (pipeline_id);
CREATE INDEX idx_staging_its_owner_sys_ext_id  ON atlas.staging_it_system_owner (system_external_id);
CREATE INDEX idx_staging_its_owner_status      ON atlas.staging_it_system_owner (staging_status);
