-- ── API search indexes and owner name search support ─────────────────────────

-- pg_trgm: enables efficient LIKE '%fragment%' search on owner names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN index for case-insensitive owner name search
CREATE INDEX idx_api_owner_name_trgm
    ON atlas.api_owner
    USING gin ((lower(first_name || ' ' || last_name)) gin_trgm_ops);

-- Partial index for filtering currently valid owners (valid_to IS NOT NULL branch)
CREATE INDEX idx_api_owner_valid_to
    ON atlas.api_owner (valid_to)
    WHERE valid_to IS NOT NULL;

-- governance_status is evaluated in every query (visibility filter) — critical
CREATE INDEX idx_api_governance_status
    ON atlas.api (governance_status);

-- type_id is used in ApiSpecification type filter
CREATE INDEX idx_api_type_id
    ON atlas.api (type_id);

-- integration_pattern_id is used in ApiSpecification integrationPattern filter
CREATE INDEX idx_api_integration_pattern_id
    ON atlas.api (integration_pattern_id);
