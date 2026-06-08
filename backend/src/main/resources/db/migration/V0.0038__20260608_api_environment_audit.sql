-- ============================================================================
-- V0.0038__20260608_api_environment_audit.sql
-- Audit table for ApiEnvironmentEntity (Hibernate Envers)
-- ============================================================================

CREATE TABLE aud.api_environment_aud (
    id                  UUID        NOT NULL,
    rev                 INTEGER     NOT NULL REFERENCES aud.revinfo(rev),
    revtype             SMALLINT,
    api_id              UUID,
    dictionary_entry_id UUID,
    service_url         VARCHAR(2048),
    PRIMARY KEY (id, rev)
);

CREATE INDEX idx_api_environment_aud_api_id ON aud.api_environment_aud (api_id);
