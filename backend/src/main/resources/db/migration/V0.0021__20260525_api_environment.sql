-- ============================================================================
-- V0.0021__20260525_api_environment.sql
-- API Environments - Dictionary Type, Seed Entries, and Junction Table
-- ============================================================================

-- ============================================================================
-- DICTIONARY TYPE
-- ============================================================================

INSERT INTO dictionary_type (
    id,
    code,
    name,
    description,
    system_defined,
    active,
    created_at,
    created_by
)
VALUES (
    gen_random_uuid(),
    'API_ENVIRONMENT',
    'API Environment',
    'Deployment environments in which the API is available',
    TRUE,
    TRUE,
    now(),
    'system'
);

-- ============================================================================
-- SEED ENTRIES
-- ============================================================================

INSERT INTO dictionary_entry (
    id,
    dictionary_type_id,
    code,
    name,
    description,
    display_order,
    active,
    system_defined,
    created_at,
    created_by
)
SELECT
    gen_random_uuid(),
    dt.id,
    v.code,
    v.name,
    v.description,
    v.display_order,
    TRUE,
    TRUE,
    now(),
    'system'
FROM dictionary_type dt
         CROSS JOIN (
    VALUES
        ('LOCAL',    'Local',    'Developer local environment',                    1),
        ('DEV',      'DEV',      'Development environment',                        2),
        ('TEST',     'TEST',     'Automated testing environment',                  3),
        ('SIT',      'SIT',      'System Integration Testing environment',         4),
        ('UAT',      'UAT',      'User Acceptance Testing environment',            5),
        ('STAGING',  'Staging',  'Staging / pre-production mirror environment',    6),
        ('PREPROD',  'PREPROD',  'Pre-production environment',                     7),
        ('PROD',     'PROD',     'Production environment',                         8),
        ('DR',       'DR',       'Disaster Recovery environment',                  9)
) AS v(code, name, description, display_order)
WHERE dt.code = 'API_ENVIRONMENT';

-- ============================================================================
-- JUNCTION TABLE: api_environment
-- ============================================================================

CREATE TABLE atlas.api_environment (
    api_id              UUID NOT NULL REFERENCES atlas.api(id) ON DELETE CASCADE,
    dictionary_entry_id UUID NOT NULL REFERENCES atlas.dictionary_entry(id),
    PRIMARY KEY (api_id, dictionary_entry_id)
);

CREATE INDEX idx_api_environment_api_id ON atlas.api_environment (api_id);
CREATE INDEX idx_api_environment_entry_id ON atlas.api_environment (dictionary_entry_id);
