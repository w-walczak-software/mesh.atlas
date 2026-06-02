-- Email Templates: HTML templates with Thymeleaf inline variable support and full audit history.
-- Variables in templates use Thymeleaf inline syntax (double-bracket dollar-brace notation).
-- Template codes are immutable UPPER_SNAKE_CASE identifiers used in email processing pipelines.

CREATE TABLE atlas.email_template
(
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    version     BIGINT        NOT NULL DEFAULT 0,
    code        VARCHAR(100)  NOT NULL,
    title       VARCHAR(500)  NOT NULL,
    body        TEXT          NOT NULL,
    description VARCHAR(2000),
    tags        JSONB         NOT NULL DEFAULT '[]',
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    created_by  VARCHAR(100)  NOT NULL DEFAULT 'system',
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    CONSTRAINT uq_email_template_code UNIQUE (code),
    CONSTRAINT chk_email_template_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE INDEX idx_email_template_active ON atlas.email_template (active);

-- Envers audit table
CREATE TABLE aud.email_template_aud
(
    id          UUID         NOT NULL,
    rev         BIGINT       NOT NULL,
    revtype     SMALLINT     NOT NULL,
    version     BIGINT,
    code        VARCHAR(100),
    title       VARCHAR(500),
    body        TEXT,
    description VARCHAR(2000),
    tags        JSONB,
    active      BOOLEAN,
    created_at  TIMESTAMP,
    created_by  VARCHAR(100),
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    CONSTRAINT pk_email_template_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_email_template_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_email_template_aud_rev ON aud.email_template_aud (rev);
