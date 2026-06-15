-- Integration datasource: stores external database connection configurations.
-- Passwords are encrypted with AES-256 before storage (IntegrationEncryptionService).

CREATE TABLE atlas.integration_datasource
(
    id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code               VARCHAR(100) NOT NULL,
    name               VARCHAR(255) NOT NULL,
    description        TEXT,
    type               VARCHAR(30)  NOT NULL,
    host               VARCHAR(500) NOT NULL,
    port               INTEGER      NOT NULL,
    database_name      VARCHAR(255) NOT NULL,
    username           VARCHAR(255) NOT NULL,
    encrypted_password TEXT         NOT NULL,
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    version            BIGINT       NOT NULL DEFAULT 0,
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),
    created_by         VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at         TIMESTAMP,
    updated_by         VARCHAR(100),

    CONSTRAINT uq_integration_datasource_code UNIQUE (code),
    CONSTRAINT chk_integration_datasource_type
        CHECK (type IN ('POSTGRESQL', 'SQLSERVER', 'ORACLE'))
);

CREATE INDEX idx_int_ds_active ON atlas.integration_datasource (active);
CREATE INDEX idx_int_ds_type   ON atlas.integration_datasource (type);
