-- ============================================================================
-- V0.0024__20260527_api_contract_version.sql
-- API: add contract_version (free-form string) to main and audit tables
-- ============================================================================

ALTER TABLE atlas.api
    ADD COLUMN contract_version VARCHAR(100);

ALTER TABLE aud.api_aud
    ADD COLUMN contract_version VARCHAR(100);
