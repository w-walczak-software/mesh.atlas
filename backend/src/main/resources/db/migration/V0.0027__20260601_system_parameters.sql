-- System Parameters: centralized platform configuration with full audit history.
-- Each parameter has a typed value slot (string/integer/decimal/boolean/date/datetime).
-- Parameter keys are immutable and follow UPPER_SNAKE_CASE naming convention.

CREATE TABLE atlas.system_parameter
(
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    version         BIGINT       NOT NULL DEFAULT 0,
    parameter_key   VARCHAR(100) NOT NULL,
    parameter_name  VARCHAR(200) NOT NULL,
    parameter_type  VARCHAR(20)  NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    string_value    TEXT,
    integer_value   BIGINT,
    decimal_value   NUMERIC(19, 4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    system_defined  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    created_by      VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at      TIMESTAMP,
    updated_by      VARCHAR(100),
    CONSTRAINT uq_system_parameter_key UNIQUE (parameter_key),
    CONSTRAINT chk_system_parameter_key_format
        CHECK (parameter_key ~ '^[A-Z][A-Z0-9_.]*$'),
    CONSTRAINT chk_system_parameter_type
        CHECK (parameter_type IN ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME'))
);

CREATE INDEX idx_system_parameter_category ON atlas.system_parameter (category);

-- Envers audit table for system parameters
CREATE TABLE aud.system_parameter_aud
(
    id             UUID     NOT NULL,
    rev            BIGINT   NOT NULL,
    revtype        SMALLINT NOT NULL,
    version        BIGINT,
    created_at     TIMESTAMP,
    created_by     VARCHAR(100),
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),
    parameter_key  VARCHAR(100),
    parameter_name VARCHAR(200),
    parameter_type VARCHAR(20),
    description    TEXT,
    category       VARCHAR(100),
    string_value   TEXT,
    integer_value  BIGINT,
    decimal_value  NUMERIC(19, 4),
    boolean_value  BOOLEAN,
    date_value     DATE,
    datetime_value TIMESTAMP,
    system_defined BOOLEAN,
    CONSTRAINT pk_system_parameter_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_system_parameter_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_system_parameter_aud_rev ON aud.system_parameter_aud (rev);

-- Seed: Governance parameter — controls whether governance workflow is triggered on new API creation
INSERT INTO atlas.system_parameter (parameter_key, parameter_name, parameter_type, description, category,
                                    boolean_value, system_defined, created_by)
VALUES ('GOVERNANCE_ENABLED_ON_API_CREATE',
        'Governance enabled on API create',
        'BOOLEAN',
        'Determines whether the governance workflow is automatically triggered when a new API is created.',
        'GOVERNANCE',
        true,
        true,
        'system');
