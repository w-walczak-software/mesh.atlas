-- Integration pipeline: defines data acquisition flows using Apache Camel XML DSL.
-- Each pipeline targets one entity type (IT_SYSTEM | API | DATA_DOMAIN) and writes
-- to the corresponding staging table before promotion to business entities.

CREATE TABLE atlas.integration_pipeline
(
    id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code           VARCHAR(100) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    status         VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    target_entity  VARCHAR(30)  NOT NULL,
    datasource_id  UUID         NOT NULL,
    camel_xml_dsl  TEXT,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    version        BIGINT       NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    created_by     VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at     TIMESTAMP,
    updated_by     VARCHAR(100),

    CONSTRAINT uq_integration_pipeline_code UNIQUE (code),
    CONSTRAINT chk_integration_pipeline_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED')),
    CONSTRAINT chk_integration_pipeline_target
        CHECK (target_entity IN ('IT_SYSTEM', 'API', 'DATA_DOMAIN')),
    CONSTRAINT fk_int_pipeline_datasource
        FOREIGN KEY (datasource_id) REFERENCES atlas.integration_datasource (id)
);

CREATE INDEX idx_int_pipeline_status      ON atlas.integration_pipeline (status);
CREATE INDEX idx_int_pipeline_datasource  ON atlas.integration_pipeline (datasource_id);
CREATE INDEX idx_int_pipeline_target      ON atlas.integration_pipeline (target_entity);
CREATE INDEX idx_int_pipeline_active      ON atlas.integration_pipeline (active);

-- Envers audit table for pipeline metadata (camel_xml_dsl excluded via @NotAudited)
CREATE TABLE aud.integration_pipeline_aud
(
    id            UUID        NOT NULL,
    rev           INTEGER     NOT NULL,
    revtype       SMALLINT,
    code          VARCHAR(100),
    name          VARCHAR(255),
    description   TEXT,
    status        VARCHAR(30),
    target_entity VARCHAR(30),
    datasource_id UUID,
    active        BOOLEAN,
    version       BIGINT,
    created_at    TIMESTAMP,
    created_by    VARCHAR(100),
    updated_at    TIMESTAMP,
    updated_by    VARCHAR(100),
    PRIMARY KEY (id, rev)
);
