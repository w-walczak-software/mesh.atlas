-- Audit log: central, append-only event store for all significant platform operations.
-- Entries are never updated or deleted. Queries optimised for time-range + filter patterns.

CREATE TABLE atlas.audit_log
(
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    category       VARCHAR(50)   NOT NULL,
    action         VARCHAR(100)  NOT NULL,
    resource_type  VARCHAR(100),
    resource_id    VARCHAR(255),
    resource_name  VARCHAR(500),
    actor_id       VARCHAR(255),
    actor_username VARCHAR(255),
    actor_email    VARCHAR(255),
    outcome        VARCHAR(20)   NOT NULL,
    severity       VARCHAR(20)   NOT NULL,
    message        TEXT,
    context        JSONB,
    ip_address     VARCHAR(45),
    correlation_id VARCHAR(255),
    error_detail   TEXT,
    CONSTRAINT chk_audit_log_outcome  CHECK (outcome  IN ('SUCCESS', 'FAILURE')),
    CONSTRAINT chk_audit_log_severity CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

-- Primary read pattern: recent events (DESC), often narrowed by time range
CREATE INDEX idx_audit_log_event_time      ON atlas.audit_log (event_time DESC);
-- Per-actor history
CREATE INDEX idx_audit_log_actor_id        ON atlas.audit_log (actor_id);
CREATE INDEX idx_audit_log_actor_username  ON atlas.audit_log (actor_username);
-- Filtering by category / action / resource
CREATE INDEX idx_audit_log_category        ON atlas.audit_log (category);
CREATE INDEX idx_audit_log_action          ON atlas.audit_log (action);
CREATE INDEX idx_audit_log_resource_type   ON atlas.audit_log (resource_type);
CREATE INDEX idx_audit_log_resource_id     ON atlas.audit_log (resource_id);
-- Outcome-based alerting queries
CREATE INDEX idx_audit_log_outcome         ON atlas.audit_log (outcome);
-- GIN index for flexible JSONB context queries
CREATE INDEX idx_audit_log_context_gin     ON atlas.audit_log USING gin (context)
    WHERE context IS NOT NULL;
