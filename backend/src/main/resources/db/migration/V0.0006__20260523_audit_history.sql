-- ── Revision info table (Hibernate Envers) ───────────────────────────────────

CREATE TABLE revinfo
(
    rev       BIGSERIAL    PRIMARY KEY,
    rev_tstmp BIGINT       NOT NULL,
    username  VARCHAR(100),
    user_id   VARCHAR(36)
);

-- ── IT System audit table ─────────────────────────────────────────────────────

CREATE TABLE it_system_aud
(
    id                      UUID     NOT NULL,
    rev                     BIGINT   NOT NULL,
    revtype                 SMALLINT NOT NULL,
    version                 BIGINT,
    created_at              TIMESTAMP,
    created_by              VARCHAR(100),
    updated_at              TIMESTAMP,
    updated_by              VARCHAR(100),
    code                    VARCHAR(100),
    name                    VARCHAR(300),
    description             TEXT,
    documentation_url       TEXT,
    repository_url          TEXT,
    status_id               UUID,
    lifecycle_stage_id      UUID,
    business_criticality_id UUID,
    data_classification_id  UUID,
    system_type_id          UUID,
    architecture_style_id   UUID,
    deployment_model_id     UUID,
    runtime_environment_id  UUID,
    tags                    JSONB,
    metadata                JSONB,
    active                  BOOLEAN,
    CONSTRAINT pk_it_system_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_it_system_aud_rev FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX idx_it_system_aud_rev ON it_system_aud (rev);

-- ── IT System Owner audit table ───────────────────────────────────────────────

CREATE TABLE it_system_owner_aud
(
    id           UUID     NOT NULL,
    rev          BIGINT   NOT NULL,
    revtype      SMALLINT NOT NULL,
    version      BIGINT,
    created_at   TIMESTAMP,
    created_by   VARCHAR(100),
    updated_at   TIMESTAMP,
    updated_by   VARCHAR(100),
    it_system_id UUID,
    role_id      UUID,
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    email        VARCHAR(200),
    valid_from   DATE,
    valid_to     DATE,
    CONSTRAINT pk_it_system_owner_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_it_system_owner_aud_rev FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX idx_it_system_owner_aud_rev       ON it_system_owner_aud (rev);
CREATE INDEX idx_it_system_owner_aud_system_id ON it_system_owner_aud (it_system_id);

-- ── Dictionary Type audit table ───────────────────────────────────────────────

CREATE TABLE dictionary_type_aud
(
    id             UUID     NOT NULL,
    rev            BIGINT   NOT NULL,
    revtype        SMALLINT NOT NULL,
    version        BIGINT,
    created_at     TIMESTAMP,
    created_by     VARCHAR(100),
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),
    code           VARCHAR(100),
    name           VARCHAR(200),
    description    TEXT,
    system_defined BOOLEAN,
    active         BOOLEAN,
    CONSTRAINT pk_dictionary_type_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_dictionary_type_aud_rev FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX idx_dictionary_type_aud_rev ON dictionary_type_aud (rev);

-- ── Dictionary Entry audit table ──────────────────────────────────────────────

CREATE TABLE dictionary_entry_aud
(
    id                 UUID     NOT NULL,
    rev                BIGINT   NOT NULL,
    revtype            SMALLINT NOT NULL,
    version            BIGINT,
    created_at         TIMESTAMP,
    created_by         VARCHAR(100),
    updated_at         TIMESTAMP,
    updated_by         VARCHAR(100),
    dictionary_type_id UUID,
    code               VARCHAR(100),
    name               VARCHAR(200),
    description        TEXT,
    display_order      INTEGER,
    active             BOOLEAN,
    system_defined     BOOLEAN,
    metadata           JSONB,
    CONSTRAINT pk_dictionary_entry_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_dictionary_entry_aud_rev FOREIGN KEY (rev) REFERENCES revinfo (rev)
);

CREATE INDEX idx_dictionary_entry_aud_rev             ON dictionary_entry_aud (rev);
CREATE INDEX idx_dictionary_entry_aud_type_id         ON dictionary_entry_aud (dictionary_type_id);
