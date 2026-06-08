-- ============================================================================
-- V0.0037__20260608_api_environment_url.sql
-- Adds service_url to api_environment and replaces composite PK with UUID.
-- ============================================================================

ALTER TABLE atlas.api_environment DROP CONSTRAINT api_environment_pkey;

ALTER TABLE atlas.api_environment
    ADD COLUMN id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN service_url VARCHAR(2048);

ALTER TABLE atlas.api_environment
    ADD CONSTRAINT pk_api_environment PRIMARY KEY (id);

ALTER TABLE atlas.api_environment
    ADD CONSTRAINT uq_api_environment UNIQUE (api_id, dictionary_entry_id);
