-- ============================================================
-- Change Request Workflow
-- Stores API change proposals, owner reviews, and decisions.
-- Statuses: SUBMITTED → UNDER_REVIEW → APPROVED|REJECTED|DEFERRED → IMPLEMENTED|CANCELLED
-- ============================================================

-- Dictionary: types of API change
INSERT INTO atlas.dictionary_type (code, name, description, system_defined, active, created_at, created_by) VALUES
('CHANGE_REQUEST_TYPE',     'Typ żądania zmiany',       'Klasyfikacja rodzaju żądanej zmiany API', true, true, now(), 'system'),
('CHANGE_REQUEST_PRIORITY', 'Priorytet żądania zmiany', 'Priorytet realizacji żądania zmiany API', true, true, now(), 'system');

-- CHANGE_REQUEST_TYPE entries
INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'FEATURE',         'Nowa funkcjonalność',        'Dodanie nowej funkcjonalności do API',             10, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'ENHANCEMENT',     'Rozszerzenie',               'Rozszerzenie istniejącej funkcjonalności',          20, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'BUG_FIX',         'Naprawa błędu',              'Naprawa błędu lub niezgodności w API',             30, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'BREAKING_CHANGE', 'Zmiana niekompatybilna',     'Zmiana łamiąca kompatybilność wsteczną',           40, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'DEPRECATION',     'Deprecjacja',                'Oznaczenie elementu API jako przestarzałego',       50, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'SECURITY',        'Bezpieczeństwo',             'Zmiana dotycząca bezpieczeństwa API',              60, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'PERFORMANCE',     'Wydajność',                  'Optymalizacja wydajności lub limitów API',          70, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'DOCUMENTATION',   'Dokumentacja',               'Aktualizacja lub poprawa dokumentacji API',        80, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_TYPE';

-- CHANGE_REQUEST_PRIORITY entries
INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'LOW',      'Niski',     'Niska pilność — planowana realizacja w przyszłości',    10, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_PRIORITY';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'MEDIUM',   'Średni',    'Standardowy priorytet realizacji',                       20, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_PRIORITY';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'HIGH',     'Wysoki',    'Pilna realizacja wymagana w najbliższym czasie',          30, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_PRIORITY';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'CRITICAL', 'Krytyczny', 'Realizacja krytyczna, blokuje integralność systemu',    40, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'CHANGE_REQUEST_PRIORITY';

-- Main change request table
CREATE TABLE atlas.change_request
(
    id                          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    api_id                      UUID         NOT NULL,
    title                       VARCHAR(255) NOT NULL,
    description                 TEXT         NOT NULL,
    change_type_id              UUID         NOT NULL,
    priority_id                 UUID         NOT NULL,
    status                      VARCHAR(30)  NOT NULL DEFAULT 'SUBMITTED',
    requester_type              VARCHAR(30)  NOT NULL DEFAULT 'INTERNAL',
    requester_user_id           VARCHAR(255),
    requester_email             VARCHAR(300) NOT NULL,
    requester_name              VARCHAR(300),
    planned_implementation_date DATE,
    planned_version             VARCHAR(50),
    implemented_at              TIMESTAMP,
    implemented_version         VARCHAR(50),
    active                      BOOLEAN      NOT NULL DEFAULT TRUE,
    version                     BIGINT       NOT NULL DEFAULT 0,
    created_at                  TIMESTAMP    NOT NULL,
    created_by                  VARCHAR(100) NOT NULL,
    updated_at                  TIMESTAMP,
    updated_by                  VARCHAR(100),

    CONSTRAINT chk_cr_status       CHECK (status IN ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','DEFERRED','IMPLEMENTED','CANCELLED')),
    CONSTRAINT chk_cr_req_type     CHECK (requester_type IN ('INTERNAL','DEVELOPER_PORTAL')),
    CONSTRAINT fk_cr_api           FOREIGN KEY (api_id)           REFERENCES atlas.api (id),
    CONSTRAINT fk_cr_change_type   FOREIGN KEY (change_type_id)   REFERENCES atlas.dictionary_entry (id),
    CONSTRAINT fk_cr_priority      FOREIGN KEY (priority_id)      REFERENCES atlas.dictionary_entry (id)
);

CREATE INDEX idx_cr_api_id     ON atlas.change_request (api_id);
CREATE INDEX idx_cr_status     ON atlas.change_request (status);
CREATE INDEX idx_cr_active     ON atlas.change_request (active);
CREATE INDEX idx_cr_requester  ON atlas.change_request (requester_email);
CREATE INDEX idx_cr_created_at ON atlas.change_request (created_at DESC);

-- Review decisions recorded per reviewer
CREATE TABLE atlas.change_request_review
(
    id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    cr_id           UUID         NOT NULL,
    reviewer_role   VARCHAR(30)  NOT NULL,
    reviewer_id     VARCHAR(255) NOT NULL,
    reviewer_name   VARCHAR(300),
    reviewer_email  VARCHAR(300) NOT NULL,
    decision        VARCHAR(30)  NOT NULL,
    comment         TEXT,
    reviewed_at     TIMESTAMP    NOT NULL,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL,
    created_by      VARCHAR(100) NOT NULL,
    updated_at      TIMESTAMP,
    updated_by      VARCHAR(100),

    CONSTRAINT chk_crr_role     CHECK (reviewer_role IN ('TECHNICAL_OWNER','BUSINESS_OWNER','ADMIN')),
    CONSTRAINT chk_crr_decision CHECK (decision IN ('APPROVED','REJECTED','DEFERRED','NEEDS_CLARIFICATION')),
    CONSTRAINT fk_crr_cr        FOREIGN KEY (cr_id) REFERENCES atlas.change_request (id)
);

CREATE INDEX idx_crr_cr_id       ON atlas.change_request_review (cr_id);
CREATE INDEX idx_crr_reviewer_id ON atlas.change_request_review (reviewer_id);

-- Envers audit table for change_request
CREATE TABLE aud.change_request_aud
(
    id                          UUID         NOT NULL,
    rev                         INTEGER      NOT NULL,
    revtype                     SMALLINT     NOT NULL,
    api_id                      UUID,
    title                       VARCHAR(255),
    status                      VARCHAR(30),
    requester_type              VARCHAR(30),
    requester_user_id           VARCHAR(255),
    requester_email             VARCHAR(300),
    requester_name              VARCHAR(300),
    planned_implementation_date DATE,
    planned_version             VARCHAR(50),
    implemented_at              TIMESTAMP,
    implemented_version         VARCHAR(50),
    active                      BOOLEAN,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_cr_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

-- Email template: notification to API owners when a change request is submitted
INSERT INTO atlas.email_template (code, title, body, description, tags, active, created_at, created_by)
VALUES (
    'CHANGE_REQUEST_SUBMITTED',
    'Nowe żądanie zmiany API',
    '<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><style>
  body{font-family:Arial,sans-serif;color:#333;background:#f5f5f5;margin:0;padding:0}
  .wrapper{max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{background:#1565C0;color:#fff;padding:24px 32px}
  .header h1{margin:0;font-size:20px;font-weight:600}
  .header p{margin:6px 0 0;font-size:14px;opacity:.85}
  .content{padding:28px 32px}
  .ft{width:100%;border-collapse:collapse;margin:16px 0}
  .ft td{padding:8px 12px;border-bottom:1px solid #eee;font-size:14px}
  .ft td:first-child{font-weight:600;color:#555;width:38%;white-space:nowrap}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;background:#e3f2fd;color:#1565c0}
  .desc{background:#f9f9f9;border-left:4px solid #1565c0;padding:12px 16px;border-radius:0 4px 4px 0;font-size:14px;margin:16px 0;line-height:1.6}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee}
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Nowe żądanie zmiany API</h1>
    <p>Zostałeś wskazany jako właściciel API, do którego wpłynęło żądanie zmiany.</p>
  </div>
  <div class="content">
    <table class="ft">
      <tr><td>API</td><td><strong>[[${apiName}]]</strong> <span class="badge">[[${apiCode}]]</span></td></tr>
      <tr><td>Wersja API</td><td>[[${apiVersion}]]</td></tr>
      <tr><td>Tytuł żądania</td><td><strong>[[${crTitle}]]</strong></td></tr>
      <tr><td>Typ zmiany</td><td>[[${changeType}]]</td></tr>
      <tr><td>Priorytet</td><td>[[${priority}]]</td></tr>
      <tr><td>Zgłaszający</td><td>[[${requesterName}]] ([[${requesterEmail}]])</td></tr>
      <tr><td>Data zgłoszenia</td><td>[[${submittedAt}]]</td></tr>
    </table>
    <p style="font-weight:600;margin:20px 0 8px;">Opis zmiany:</p>
    <div class="desc">[[${crDescription}]]</div>
    <p style="margin-top:20px;">Zaloguj się do <strong>mesh.atlas</strong>, aby zaopiniować żądanie.</p>
  </div>
  <div class="footer">
    <p>Otrzymujesz tę wiadomość, ponieważ jesteś właścicielem API w platformie mesh.atlas.</p>
  </div>
</div>
</body>
</html>',
    'Powiadomienie do właścicieli API o nowym żądaniu zmiany złożonym przez użytkownika.',
    '["change-request","api","governance"]',
    TRUE, NOW(), 'system'
);

-- Email template: notification to requester when status changes
INSERT INTO atlas.email_template (code, title, body, description, tags, active, created_at, created_by)
VALUES (
    'CHANGE_REQUEST_STATUS_CHANGED',
    'Aktualizacja statusu żądania zmiany API',
    '<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><style>
  body{font-family:Arial,sans-serif;color:#333;background:#f5f5f5;margin:0;padding:0}
  .wrapper{max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .header{padding:24px 32px;color:#fff}
  .approved{background:#2e7d32}
  .rejected{background:#c62828}
  .deferred{background:#e65100}
  .review{background:#1565C0}
  .other{background:#37474f}
  .header h1{margin:0;font-size:20px;font-weight:600}
  .header p{margin:6px 0 0;font-size:14px;opacity:.85}
  .content{padding:28px 32px}
  .ft{width:100%;border-collapse:collapse;margin:16px 0}
  .ft td{padding:8px 12px;border-bottom:1px solid #eee;font-size:14px}
  .ft td:first-child{font-weight:600;color:#555;width:38%;white-space:nowrap}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;background:#e3f2fd;color:#1565c0}
  .comment{background:#f9f9f9;border-left:4px solid #ccc;padding:12px 16px;border-radius:0 4px 4px 0;font-size:14px;margin:16px 0;line-height:1.6;font-style:italic}
  .footer{background:#f5f5f5;padding:16px 32px;font-size:12px;color:#888;border-top:1px solid #eee}
</style></head>
<body>
<div class="wrapper">
  <div class="header [[${headerClass}]]">
    <h1>Status żądania zmiany: [[${statusLabel}]]</h1>
    <p>Twoje żądanie zmiany API zostało zaktualizowane.</p>
  </div>
  <div class="content">
    <p>Drogi [[${requesterName}]],</p>
    <p>Informujemy, że status Twojego żądania zmiany API uległ zmianie.</p>
    <table class="ft">
      <tr><td>API</td><td><strong>[[${apiName}]]</strong> <span class="badge">[[${apiCode}]]</span></td></tr>
      <tr><td>Tytuł żądania</td><td>[[${crTitle}]]</td></tr>
      <tr><td>Nowy status</td><td><strong>[[${statusLabel}]]</strong></td></tr>
      <tr><td>Recenzent</td><td>[[${reviewerName}]] ([[${reviewerRole}]])</td></tr>
      <tr><td>Data decyzji</td><td>[[${reviewedAt}]]</td></tr>
    </table>
    <p th:if="${comment != null and !#strings.isEmpty(comment)}" style="font-weight:600;margin:20px 0 8px;">Komentarz recenzenta:</p>
    <div th:if="${comment != null and !#strings.isEmpty(comment)}" class="comment">[[${comment}]]</div>
    <p style="margin-top:20px;">Zaloguj się do <strong>mesh.atlas</strong>, aby zobaczyć szczegóły żądania.</p>
  </div>
  <div class="footer">
    <p>Otrzymujesz tę wiadomość, ponieważ jesteś autorem żądania zmiany API w platformie mesh.atlas.</p>
  </div>
</div>
</body>
</html>',
    'Powiadomienie do zgłaszającego o zmianie statusu żądania zmiany API.',
    '["change-request","api","governance"]',
    TRUE, NOW(), 'system'
);
