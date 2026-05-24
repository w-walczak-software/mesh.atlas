-- ── Data Domain table ─────────────────────────────────────────────────────────

CREATE TABLE data_domain
(
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(100) NOT NULL,
    name              VARCHAR(300) NOT NULL,
    description       TEXT,
    documentation_url TEXT,
    tags              JSONB,
    metadata          JSONB,
    active            BOOLEAN      NOT NULL    DEFAULT TRUE,
    version           BIGINT       NOT NULL    DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL    DEFAULT now(),
    created_by        VARCHAR(100) NOT NULL,
    updated_at        TIMESTAMP,
    updated_by        VARCHAR(100),

    CONSTRAINT uq_data_domain_code
        UNIQUE (code),
    CONSTRAINT chk_data_domain_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_-]*$'),
    CONSTRAINT chk_data_domain_name_not_blank
        CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX idx_data_domain_active ON data_domain (active);

CREATE INDEX idx_data_domain_tags_gin
    ON data_domain USING gin (tags)
    WHERE tags IS NOT NULL;

-- ── Data Domain Attachment table ──────────────────────────────────────────────

CREATE TABLE data_domain_attachment
(
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    data_domain_id UUID         NOT NULL,
    file_name      VARCHAR(500) NOT NULL,
    content_type   VARCHAR(200) NOT NULL,
    file_size      BIGINT       NOT NULL,
    content        BYTEA        NOT NULL,
    created_at     TIMESTAMP    NOT NULL    DEFAULT now(),
    created_by     VARCHAR(100) NOT NULL,

    CONSTRAINT fk_dda_domain
        FOREIGN KEY (data_domain_id) REFERENCES data_domain (id)
);

CREATE INDEX idx_data_domain_attachment_domain ON data_domain_attachment (data_domain_id);

-- ── Data Domain audit table ───────────────────────────────────────────────────

CREATE TABLE aud.data_domain_aud
(
    id                UUID     NOT NULL,
    rev               BIGINT   NOT NULL,
    revtype           SMALLINT NOT NULL,
    version           BIGINT,
    created_at        TIMESTAMP,
    created_by        VARCHAR(100),
    updated_at        TIMESTAMP,
    updated_by        VARCHAR(100),
    code              VARCHAR(100),
    name              VARCHAR(300),
    description       TEXT,
    documentation_url TEXT,
    tags              JSONB,
    metadata          JSONB,
    active            BOOLEAN,

    CONSTRAINT pk_data_domain_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_data_domain_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_data_domain_aud_rev ON aud.data_domain_aud (rev);
