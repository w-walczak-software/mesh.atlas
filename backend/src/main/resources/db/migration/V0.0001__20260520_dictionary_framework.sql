CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE dictionary_type
(
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code           VARCHAR(100) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    system_defined BOOLEAN      NOT NULL DEFAULT TRUE,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    created_by     VARCHAR(100) NOT NULL,
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),
    CONSTRAINT uq_dictionary_type_code
        UNIQUE (code),
    CONSTRAINT chk_dictionary_type_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT chk_dictionary_type_name_not_blank
        CHECK (char_length(trim(name)) > 0)
);

CREATE TABLE dictionary_entry
(
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    dictionary_type_id UUID         NOT NULL,
    code               VARCHAR(100) NOT NULL,
    name               VARCHAR(200) NOT NULL,
    description        TEXT,
    display_order      INTEGER      NOT NULL DEFAULT 0,
    active             BOOLEAN      NOT NULL DEFAULT TRUE,
    system_defined     BOOLEAN      NOT NULL DEFAULT TRUE,
    metadata           JSONB,
    created_at         TIMESTAMP    NOT NULL DEFAULT now(),
    created_by         VARCHAR(100) NOT NULL,
    updated_at         TIMESTAMP,
    updated_by         VARCHAR(100),
    CONSTRAINT fk_dictionary_entry_type
        FOREIGN KEY (dictionary_type_id) REFERENCES dictionary_type (id) ON DELETE RESTRICT,
    CONSTRAINT uq_dictionary_entry
        UNIQUE (dictionary_type_id, code),
    CONSTRAINT chk_dictionary_entry_code_not_blank
        CHECK (char_length(trim(code)) > 0),
    CONSTRAINT chk_dictionary_entry_name_not_blank
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_dictionary_entry_display_order_non_negative
        CHECK (display_order >= 0)
);

-- dictionary_type indexes
CREATE INDEX idx_dictionary_type_active
    ON dictionary_type (active);

-- dictionary_entry indexes
-- (dictionary_type_id, code) is already covered by uq_dictionary_entry.
-- This index adds 'active' and 'display_order' for the primary read pattern:
-- active entries of a given type ordered for display.
CREATE INDEX idx_dictionary_entry_type_active_order
    ON dictionary_entry (dictionary_type_id, active, display_order);

-- GIN index for JSONB metadata queries (e.g. @>, ?, jsonb_path_exists).
-- Partial: skips rows with null metadata to keep the index compact.
CREATE INDEX idx_dictionary_entry_metadata_gin
    ON dictionary_entry USING gin (metadata)
    WHERE metadata IS NOT NULL;
