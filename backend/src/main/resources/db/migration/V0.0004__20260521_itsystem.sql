CREATE TABLE it_system
(
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code                    VARCHAR(100) NOT NULL,
    name                    VARCHAR(300) NOT NULL,
    description             TEXT,
    owner                   VARCHAR(200),
    business_owner          VARCHAR(200),
    technical_owner         VARCHAR(200),
    documentation_url       TEXT,
    repository_url          TEXT,
    status_id               UUID         NOT NULL,
    lifecycle_stage_id      UUID         NOT NULL,
    business_criticality_id UUID         NOT NULL,
    data_classification_id  UUID         NOT NULL,
    system_type_id          UUID         NOT NULL,
    architecture_style_id   UUID,
    deployment_model_id     UUID,
    runtime_environment_id  UUID,
    tags                    JSONB,
    metadata                JSONB,
    active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    version                 BIGINT       NOT NULL DEFAULT 0,
    created_at              TIMESTAMP    NOT NULL DEFAULT now(),
    created_by              VARCHAR(100) NOT NULL,
    updated_at              TIMESTAMP,
    updated_by              VARCHAR(100),

    CONSTRAINT uq_it_system_code
        UNIQUE (code),
    CONSTRAINT chk_it_system_code_format
        CHECK (code ~ '^[A-Z][A-Z0-9_-]*$'),
    CONSTRAINT chk_it_system_name_not_blank
        CHECK (char_length(trim(name)) > 0),
    CONSTRAINT fk_it_system_status
        FOREIGN KEY (status_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_lifecycle_stage
        FOREIGN KEY (lifecycle_stage_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_business_criticality
        FOREIGN KEY (business_criticality_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_data_classification
        FOREIGN KEY (data_classification_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_system_type
        FOREIGN KEY (system_type_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_architecture_style
        FOREIGN KEY (architecture_style_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_deployment_model
        FOREIGN KEY (deployment_model_id) REFERENCES dictionary_entry (id),
    CONSTRAINT fk_it_system_runtime_environment
        FOREIGN KEY (runtime_environment_id) REFERENCES dictionary_entry (id)
);

CREATE INDEX idx_it_system_active                  ON it_system (active);
CREATE INDEX idx_it_system_status_id               ON it_system (status_id);
CREATE INDEX idx_it_system_lifecycle_stage_id      ON it_system (lifecycle_stage_id);
CREATE INDEX idx_it_system_business_criticality_id ON it_system (business_criticality_id);
CREATE INDEX idx_it_system_system_type_id          ON it_system (system_type_id);

CREATE INDEX idx_it_system_tags_gin
    ON it_system USING gin (tags)
    WHERE tags IS NOT NULL;

CREATE INDEX idx_it_system_metadata_gin
    ON it_system USING gin (metadata)
    WHERE metadata IS NOT NULL;
