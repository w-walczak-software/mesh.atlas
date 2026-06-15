-- Allow external_value to be null for initialized (stub) mapping entries.
-- Stubs are created during initialization and filled in by the user later.
-- Unique constraint changes:
--   - old: (pipeline_id, dictionary_type_code, external_value) — breaks with nulls
--   - new: (pipeline_id, atlas_entry_id) — each atlas entry once per pipeline
--          + partial unique index on (pipeline_id, dictionary_type_code, external_value) WHERE NOT NULL

ALTER TABLE atlas.pipeline_dictionary_mapping
    ALTER COLUMN external_value DROP NOT NULL;

ALTER TABLE atlas.pipeline_dictionary_mapping
    DROP CONSTRAINT uq_pipeline_dict_mapping;

ALTER TABLE atlas.pipeline_dictionary_mapping
    ADD CONSTRAINT uq_pipeline_dict_mapping_entry
        UNIQUE (pipeline_id, atlas_entry_id);

CREATE UNIQUE INDEX uq_pipeline_dict_mapping_value
    ON atlas.pipeline_dictionary_mapping (pipeline_id, dictionary_type_code, external_value)
    WHERE external_value IS NOT NULL;
