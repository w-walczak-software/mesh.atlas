-- Email Configuration: single-row SMTP settings for outbound email delivery.
-- Supports Gmail (App Password), Exchange (on-prem/Office 365) and custom SMTP.
-- Identified by config_key = 'default' — only one row exists at all times.

CREATE TABLE atlas.email_config
(
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    version           BIGINT       NOT NULL DEFAULT 0,
    config_key        VARCHAR(50)  NOT NULL,
    provider          VARCHAR(50)  NOT NULL DEFAULT 'CUSTOM',
    host              VARCHAR(255),
    port              INTEGER      NOT NULL DEFAULT 587,
    username          VARCHAR(255),
    password          TEXT,
    from_address      VARCHAR(255),
    from_display_name VARCHAR(200),
    encryption        VARCHAR(20)  NOT NULL DEFAULT 'TLS',
    enabled           BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    created_by        VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at        TIMESTAMP,
    updated_by        VARCHAR(100),
    CONSTRAINT uq_email_config_key UNIQUE (config_key),
    CONSTRAINT chk_email_config_provider
        CHECK (provider IN ('GMAIL', 'EXCHANGE', 'CUSTOM')),
    CONSTRAINT chk_email_config_encryption
        CHECK (encryption IN ('NONE', 'TLS', 'SSL'))
);

-- Email Log: immutable record of every outbound email send attempt.
CREATE TABLE atlas.email_log
(
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    sent_at       TIMESTAMP    NOT NULL DEFAULT now(),
    recipient     VARCHAR(500) NOT NULL,
    subject       VARCHAR(500) NOT NULL,
    status        VARCHAR(20)  NOT NULL,
    error_message TEXT,
    sent_by       VARCHAR(200),
    is_test       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_email_log_status CHECK (status IN ('SENT', 'FAILED'))
);

CREATE INDEX idx_email_log_sent_at ON atlas.email_log (sent_at DESC);
CREATE INDEX idx_email_log_status  ON atlas.email_log (status);

-- Seed disabled default configuration
INSERT INTO atlas.email_config (config_key, provider, host, port, encryption, enabled, created_by)
VALUES ('default', 'CUSTOM', '', 587, 'TLS', FALSE, 'system');
