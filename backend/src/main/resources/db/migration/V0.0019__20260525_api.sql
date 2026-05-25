-- ============================================================================
-- V0.0019__20260525_api.sql
-- API Registry - Core Tables
-- ============================================================================

-- ── atlas.api ──────────────────────────────────────────────────────────────

CREATE TABLE atlas.api
(
    id                       UUID           NOT NULL DEFAULT gen_random_uuid(),
    code                     VARCHAR(100)   NOT NULL,
    name                     VARCHAR(300)   NOT NULL,
    description              TEXT,
    api_version              VARCHAR(100),
    type_id                  UUID,
    status_id                UUID           NOT NULL,
    source_system_id         UUID,
    target_system_id         UUID,
    transport_layer_id       UUID,
    protocol_id              UUID,
    authentication_method_id UUID,
    security_policy_id       UUID,
    integration_pattern_id   UUID,
    message_format_id        UUID,
    sla_response_time_ms     INT,
    sla_uptime_pct           DECIMAL(5, 2),
    sla_tier_id              UUID,
    sla_description          TEXT,
    contract_type_id         UUID,
    contract_url             TEXT,
    documentation_url        TEXT,
    tags                     JSONB,
    active                   BOOLEAN        NOT NULL DEFAULT TRUE,
    version                  BIGINT         NOT NULL DEFAULT 0,
    created_at               TIMESTAMP,
    created_by               VARCHAR(255),
    updated_at               TIMESTAMP,
    updated_by               VARCHAR(255),

    CONSTRAINT pk_api
        PRIMARY KEY (id),
    CONSTRAINT uq_api_code
        UNIQUE (code),
    CONSTRAINT fk_api_type
        FOREIGN KEY (type_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_status
        FOREIGN KEY (status_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_source_system
        FOREIGN KEY (source_system_id) REFERENCES it_system (id) ON DELETE SET NULL,
    CONSTRAINT fk_api_target_system
        FOREIGN KEY (target_system_id) REFERENCES it_system (id) ON DELETE SET NULL,
    CONSTRAINT fk_api_transport_layer
        FOREIGN KEY (transport_layer_id) REFERENCES transport_layer (id) ON DELETE SET NULL,
    CONSTRAINT fk_api_protocol
        FOREIGN KEY (protocol_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_authentication_method
        FOREIGN KEY (authentication_method_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_security_policy
        FOREIGN KEY (security_policy_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_integration_pattern
        FOREIGN KEY (integration_pattern_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_message_format
        FOREIGN KEY (message_format_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_sla_tier
        FOREIGN KEY (sla_tier_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_api_contract_type
        FOREIGN KEY (contract_type_id) REFERENCES dictionary_entry (id)
);

CREATE INDEX idx_api_active           ON atlas.api (active);
CREATE INDEX idx_api_status_id        ON atlas.api (status_id);
CREATE INDEX idx_api_source_system_id ON atlas.api (source_system_id);
CREATE INDEX idx_api_target_system_id ON atlas.api (target_system_id);
CREATE INDEX idx_api_transport_layer  ON atlas.api (transport_layer_id);

CREATE INDEX idx_api_tags_gin
    ON atlas.api USING gin (tags)
    WHERE tags IS NOT NULL;

-- ── atlas.api_owner ────────────────────────────────────────────────────────

CREATE TABLE atlas.api_owner
(
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    api_id     UUID         NOT NULL,
    role_id    UUID         NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name  VARCHAR(150) NOT NULL,
    email      VARCHAR(300) NOT NULL,
    valid_from DATE         NOT NULL,
    valid_to   DATE,
    version    BIGINT       NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP,
    updated_by VARCHAR(255),

    CONSTRAINT pk_api_owner
        PRIMARY KEY (id),
    CONSTRAINT fk_api_owner_api
        FOREIGN KEY (api_id) REFERENCES atlas.api (id) ON DELETE CASCADE,
    CONSTRAINT fk_api_owner_role
        FOREIGN KEY (role_id) REFERENCES dictionary_entry (id)
);

CREATE INDEX idx_api_owner_api_id ON atlas.api_owner (api_id);

-- ── atlas.api_attachment ───────────────────────────────────────────────────

CREATE TABLE atlas.api_attachment
(
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    api_id           UUID         NOT NULL,
    file_name        VARCHAR(500) NOT NULL,
    content_type     VARCHAR(200) NOT NULL,
    file_size        BIGINT       NOT NULL,
    content          BYTEA        NOT NULL,
    description      TEXT,
    contract_type_id UUID,
    created_at       TIMESTAMP    NOT NULL,
    created_by       VARCHAR(100) NOT NULL,

    CONSTRAINT pk_api_attachment
        PRIMARY KEY (id),
    CONSTRAINT fk_api_attachment_api
        FOREIGN KEY (api_id) REFERENCES atlas.api (id) ON DELETE CASCADE,
    CONSTRAINT fk_api_attachment_contract_type
        FOREIGN KEY (contract_type_id) REFERENCES dictionary_entry (id)
);

CREATE INDEX idx_api_attachment_api_id ON atlas.api_attachment (api_id);

-- ── atlas.api_data_domain ──────────────────────────────────────────────────

CREATE TABLE atlas.api_data_domain
(
    api_id         UUID NOT NULL,
    data_domain_id UUID NOT NULL,

    CONSTRAINT pk_api_data_domain
        PRIMARY KEY (api_id, data_domain_id),
    CONSTRAINT fk_api_data_domain_api
        FOREIGN KEY (api_id) REFERENCES atlas.api (id) ON DELETE CASCADE,
    CONSTRAINT fk_api_data_domain_domain
        FOREIGN KEY (data_domain_id) REFERENCES data_domain (id) ON DELETE CASCADE
);

-- ── aud.api_aud ────────────────────────────────────────────────────────────

CREATE TABLE aud.api_aud
(
    id                       UUID     NOT NULL,
    rev                      BIGINT   NOT NULL,
    revtype                  SMALLINT NOT NULL,
    version                  BIGINT,
    created_at               TIMESTAMP,
    created_by               VARCHAR(255),
    updated_at               TIMESTAMP,
    updated_by               VARCHAR(255),
    code                     VARCHAR(100),
    name                     VARCHAR(300),
    description              TEXT,
    api_version              VARCHAR(100),
    type_id                  UUID,
    status_id                UUID,
    source_system_id         UUID,
    target_system_id         UUID,
    transport_layer_id       UUID,
    protocol_id              UUID,
    authentication_method_id UUID,
    security_policy_id       UUID,
    integration_pattern_id   UUID,
    message_format_id        UUID,
    sla_response_time_ms     INT,
    sla_uptime_pct           DECIMAL(5, 2),
    sla_tier_id              UUID,
    sla_description          TEXT,
    contract_type_id         UUID,
    contract_url             TEXT,
    documentation_url        TEXT,
    tags                     JSONB,
    active                   BOOLEAN,

    CONSTRAINT pk_api_aud
        PRIMARY KEY (id, rev),
    CONSTRAINT fk_api_aud_rev
        FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_api_aud_rev ON aud.api_aud (rev);

-- ── aud.api_owner_aud ──────────────────────────────────────────────────────

CREATE TABLE aud.api_owner_aud
(
    id         UUID     NOT NULL,
    rev        BIGINT   NOT NULL,
    revtype    SMALLINT NOT NULL,
    version    BIGINT,
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP,
    updated_by VARCHAR(255),
    api_id     UUID,
    role_id    UUID,
    first_name VARCHAR(150),
    last_name  VARCHAR(150),
    email      VARCHAR(300),
    valid_from DATE,
    valid_to   DATE,

    CONSTRAINT pk_api_owner_aud
        PRIMARY KEY (id, rev),
    CONSTRAINT fk_api_owner_aud_rev
        FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_api_owner_aud_rev ON aud.api_owner_aud (rev);

-- ── aud.api_attachment_aud ────────────────────────────────────────────────

CREATE TABLE aud.api_attachment_aud
(
    id               UUID     NOT NULL,
    rev              BIGINT   NOT NULL,
    revtype          SMALLINT NOT NULL,
    api_id           UUID,
    file_name        VARCHAR(500),
    content_type     VARCHAR(200),
    file_size        BIGINT,
    description      TEXT,
    contract_type_id UUID,
    created_at       TIMESTAMP,
    created_by       VARCHAR(100),

    CONSTRAINT pk_api_attachment_aud
        PRIMARY KEY (id, rev),
    CONSTRAINT fk_api_attachment_aud_rev
        FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_api_attachment_aud_rev ON aud.api_attachment_aud (rev);
