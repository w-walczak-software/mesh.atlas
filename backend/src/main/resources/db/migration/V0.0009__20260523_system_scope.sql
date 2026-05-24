-- Add SYSTEM_SCOPE dictionary type classifying systems as internal,
-- external system, or external organization.
-- Add nullable scope_id FK to it_system and corresponding AUD column.

INSERT INTO dictionary_type (id, code, name, description, system_defined, active, created_at, created_by)
VALUES (gen_random_uuid(), 'SYSTEM_SCOPE', 'System Scope',
        'Classifies a system as internal, external, or an external organization', TRUE, TRUE, now(), 'system');

INSERT INTO dictionary_entry (id, dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT gen_random_uuid(), dt.id, v.code, v.name, v.description, v.display_order, TRUE, TRUE, now(), 'system'
FROM dictionary_type dt
         CROSS JOIN (VALUES
             ('INTERNAL',             'Internal System',       'System operated and owned within the enterprise',                    1),
             ('EXTERNAL_SYSTEM',      'External System',       'System provided by another organization or enterprise',              2),
             ('EXTERNAL_ORGANIZATION','External Organization',  'External organization or institution (e.g. NBP, KIR)',               3)
         ) AS v(code, name, description, display_order)
WHERE dt.code = 'SYSTEM_SCOPE';

ALTER TABLE it_system
    ADD COLUMN scope_id UUID,
    ADD CONSTRAINT fk_it_system_scope FOREIGN KEY (scope_id) REFERENCES dictionary_entry (id);

CREATE INDEX idx_it_system_scope_id ON it_system (scope_id);

ALTER TABLE it_system_aud
    ADD COLUMN scope_id UUID;
