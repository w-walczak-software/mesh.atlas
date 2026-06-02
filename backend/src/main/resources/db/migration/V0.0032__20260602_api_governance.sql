-- ── API Governance: status tracking and review audit ─────────────────────────
-- governance_status: PENDING_VERIFICATION | VERIFIED | REQUIRES_MODIFICATION | PENDING_REVIEW
-- All existing APIs are considered VERIFIED (pre-governance data).

ALTER TABLE atlas.api
    ADD COLUMN governance_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    ADD COLUMN governance_note   TEXT;

ALTER TABLE atlas.api
    ADD CONSTRAINT chk_api_governance_status
        CHECK (governance_status IN ('PENDING_VERIFICATION','VERIFIED','REQUIRES_MODIFICATION','PENDING_REVIEW'));

-- Audit table mirrors the new columns
ALTER TABLE aud.api_aud
    ADD COLUMN governance_status VARCHAR(30),
    ADD COLUMN governance_note   TEXT;

-- ── api_governance_review: immutable audit log of each review action ──────────
CREATE TABLE atlas.api_governance_review
(
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    api_id            UUID         NOT NULL,
    action            VARCHAR(20)  NOT NULL,   -- APPROVED | REJECTED
    previous_status   VARCHAR(30)  NOT NULL,
    new_status        VARCHAR(30)  NOT NULL,
    note              TEXT,
    reviewed_at       TIMESTAMP    NOT NULL DEFAULT now(),
    reviewed_by       VARCHAR(100) NOT NULL,

    CONSTRAINT chk_api_governance_review_action
        CHECK (action IN ('APPROVED','REJECTED')),
    CONSTRAINT fk_api_governance_review_api
        FOREIGN KEY (api_id) REFERENCES atlas.api (id) ON DELETE CASCADE
);

CREATE INDEX idx_api_governance_review_api_id ON atlas.api_governance_review (api_id);
CREATE INDEX idx_api_governance_review_reviewed_at ON atlas.api_governance_review (reviewed_at DESC);
