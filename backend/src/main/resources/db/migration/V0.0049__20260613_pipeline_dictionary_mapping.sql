-- Pipeline dictionary mapping: translates external system values to mesh.atlas dictionary entries.
-- Each pipeline has its own set of mappings per dictionary type code.
-- Example: externalValue="Production" + dictionaryTypeCode="SYSTEM_STATUS" → atlas entry "PROD"

CREATE TABLE atlas.pipeline_dictionary_mapping
(
    id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id          UUID         NOT NULL,
    dictionary_type_code VARCHAR(100) NOT NULL,
    external_value       VARCHAR(500) NOT NULL,
    atlas_entry_id       UUID         NOT NULL,
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           TIMESTAMP    NOT NULL DEFAULT now(),
    created_by           VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at           TIMESTAMP,
    updated_by           VARCHAR(100),

    CONSTRAINT uq_pipeline_dict_mapping
        UNIQUE (pipeline_id, dictionary_type_code, external_value),
    CONSTRAINT fk_pdm_pipeline
        FOREIGN KEY (pipeline_id) REFERENCES atlas.integration_pipeline (id) ON DELETE CASCADE,
    CONSTRAINT fk_pdm_atlas_entry
        FOREIGN KEY (atlas_entry_id) REFERENCES atlas.dictionary_entry (id)
);

CREATE INDEX idx_pdm_pipeline_id ON atlas.pipeline_dictionary_mapping (pipeline_id);
CREATE INDEX idx_pdm_entry_id    ON atlas.pipeline_dictionary_mapping (atlas_entry_id);
