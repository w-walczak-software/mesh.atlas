-- ============================================================================
-- V0.0023__20260527_attachment_versioning.sql
-- API Attachment: versioning (free-form string) + lifecycle status
-- ============================================================================

-- ── Dictionary type: ATTACHMENT_STATUS ────────────────────────────────────

INSERT INTO dictionary_type (id, code, name, description, system_defined, active, created_at, created_by)
VALUES (gen_random_uuid(), 'ATTACHMENT_STATUS', 'Attachment Status',
        'Lifecycle status of API attachment documents', TRUE, TRUE, now(), 'system');

INSERT INTO dictionary_entry (id, dictionary_type_id, code, name, description, display_order, system_defined, active, created_at, created_by)
SELECT
    gen_random_uuid(),
    t.id,
    v.code,
    v.name,
    v.description,
    v.display_order,
    TRUE,
    TRUE,
    now(),
    'system'
FROM dictionary_type t,
     (VALUES
          ('DRAFT',        'Draft',        'Document is a working draft, not yet reviewed',   10),
          ('UNDER_REVIEW', 'Under Review', 'Document is pending review or approval',          20),
          ('ACTIVE',       'Active',       'Document is approved and currently in use',       30),
          ('DEPRECATED',   'Deprecated',   'Document is outdated and superseded by a newer version', 40),
          ('ARCHIVED',     'Archived',     'Document has been archived and is no longer in use',     50)
     ) AS v(code, name, description, display_order)
WHERE t.code = 'ATTACHMENT_STATUS';

-- ── Add versioning columns to atlas.api_attachment ─────────────────────────

ALTER TABLE atlas.api_attachment
    ADD COLUMN attachment_version  VARCHAR(100),
    ADD COLUMN attachment_status_id UUID
        CONSTRAINT fk_api_attachment_status REFERENCES dictionary_entry (id);

CREATE INDEX idx_api_attachment_status ON atlas.api_attachment (attachment_status_id);

-- ── Extend audit table aud.api_attachment_aud ──────────────────────────────

ALTER TABLE aud.api_attachment_aud
    ADD COLUMN attachment_version   VARCHAR(100),
    ADD COLUMN attachment_status_id UUID;
