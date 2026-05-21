-- ── SYSTEM_OWNER_ROLE dictionary type ────────────────────────────────────────

INSERT INTO dictionary_type (id, code, name, description, system_defined, active, created_at, created_by)
VALUES (gen_random_uuid(), 'SYSTEM_OWNER_ROLE',
        'Rola właściciela systemu',
        'Określa typ odpowiedzialności osoby przypisanej do systemu informatycznego.',
        true, true, now(), 'system');

INSERT INTO dictionary_entry (id, dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT gen_random_uuid(), dt.id, e.code, e.name, e.description, e.display_order, true, true, now(), 'system'
FROM dictionary_type dt,
     (VALUES
          ('BUSINESS_OWNER',   'Właściciel biznesowy',   'Osoba odpowiedzialna za system po stronie biznesu.',           10),
          ('TECHNICAL_OWNER',  'Właściciel techniczny',  'Osoba odpowiedzialna za warstwę techniczną systemu.',          20),
          ('SYSTEM_ADMIN',     'Administrator systemu',  'Osoba zarządzająca codzienną eksploatacją systemu.',           30),
          ('ARCHITECT',        'Architekt rozwiązania',  'Osoba odpowiedzialna za architekturę i kierunek techniczny.',  40),
          ('SECURITY_OFFICER', 'Oficer bezpieczeństwa',  'Osoba odpowiedzialna za bezpieczeństwo i zgodność systemu.',   50),
          ('PRODUCT_OWNER',    'Product Owner',          'Osoba prowadząca backlog i priorytetyzację produktu.',         60)
     ) AS e(code, name, description, display_order)
WHERE dt.code = 'SYSTEM_OWNER_ROLE';

-- ── Drop obsolete owner string columns ───────────────────────────────────────

ALTER TABLE it_system
    DROP COLUMN IF EXISTS owner,
    DROP COLUMN IF EXISTS business_owner,
    DROP COLUMN IF EXISTS technical_owner;

-- ── it_system_owner table ─────────────────────────────────────────────────────

CREATE TABLE it_system_owner
(
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    it_system_id UUID         NOT NULL,
    role_id      UUID         NOT NULL,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(200) NOT NULL,
    valid_from   DATE         NOT NULL,
    valid_to     DATE,
    version      BIGINT       NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    created_by   VARCHAR(100) NOT NULL,
    updated_at   TIMESTAMP,
    updated_by   VARCHAR(100),

    CONSTRAINT chk_it_system_owner_first_name_not_blank
        CHECK (char_length(trim(first_name)) > 0),
    CONSTRAINT chk_it_system_owner_last_name_not_blank
        CHECK (char_length(trim(last_name)) > 0),
    CONSTRAINT chk_it_system_owner_email_not_blank
        CHECK (char_length(trim(email)) > 0),
    CONSTRAINT chk_it_system_owner_valid_period
        CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT fk_it_system_owner_system
        FOREIGN KEY (it_system_id) REFERENCES it_system (id) ON DELETE CASCADE,
    CONSTRAINT fk_it_system_owner_role
        FOREIGN KEY (role_id) REFERENCES dictionary_entry (id)
);

CREATE INDEX idx_it_system_owner_system_id ON it_system_owner (it_system_id);
CREATE INDEX idx_it_system_owner_role_id   ON it_system_owner (role_id);
CREATE INDEX idx_it_system_owner_valid     ON it_system_owner (it_system_id, valid_from, valid_to);
