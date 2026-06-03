-- Dictionary Type Translations: multi-language names and descriptions for dictionary types.
-- Mirrors the same pattern as dictionary_entry_translation (V0.0034).

CREATE TABLE atlas.dictionary_type_translation
(
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    version     BIGINT       NOT NULL DEFAULT 0,
    type_id     UUID         NOT NULL,
    lang_code   VARCHAR(10)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    created_by  VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    CONSTRAINT uq_dictionary_type_translation      UNIQUE (type_id, lang_code),
    CONSTRAINT fk_dictionary_type_translation_type  FOREIGN KEY (type_id) REFERENCES atlas.dictionary_type (id),
    CONSTRAINT chk_dict_type_translation_lang_code  CHECK (lang_code ~ '^[a-z]{2,10}$')
);

CREATE INDEX idx_dict_type_translation_type_id ON atlas.dictionary_type_translation (type_id);

CREATE TABLE aud.dictionary_type_translation_aud
(
    id          UUID         NOT NULL,
    rev         BIGINT       NOT NULL,
    revtype     SMALLINT     NOT NULL,
    version     BIGINT,
    created_at  TIMESTAMP,
    created_by  VARCHAR(100),
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    type_id     UUID,
    lang_code   VARCHAR(10),
    name        VARCHAR(200),
    description TEXT,
    CONSTRAINT pk_dict_type_translation_aud     PRIMARY KEY (id, rev),
    CONSTRAINT fk_dict_type_translation_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_dict_type_translation_aud_rev ON aud.dictionary_type_translation_aud (rev);

-- =============================================================================
-- DICTIONARY TYPE TRANSLATIONS — Polish (pl)
-- All 26 types: canonical names are in English (except SYSTEM_OWNER_ROLE).
-- =============================================================================

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Status systemu', 'Status cyklu życia systemów IT', 'system'
FROM atlas.dictionary_type WHERE code = 'SYSTEM_STATUS';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Etap cyklu życia', 'Etapy cyklu wytwarzania oprogramowania', 'system'
FROM atlas.dictionary_type WHERE code = 'LIFECYCLE_STAGE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Krytyczność biznesowa', 'Poziom wpływu biznesowego systemu', 'system'
FROM atlas.dictionary_type WHERE code = 'BUSINESS_CRITICALITY';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Klasyfikacja danych', 'Klasyfikacja wrażliwości przetwarzanych danych', 'system'
FROM atlas.dictionary_type WHERE code = 'DATA_CLASSIFICATION';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Typ systemu', 'Klasyfikacja systemów IT', 'system'
FROM atlas.dictionary_type WHERE code = 'SYSTEM_TYPE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Styl architektoniczny', 'Style architektoniczne oprogramowania', 'system'
FROM atlas.dictionary_type WHERE code = 'ARCHITECTURE_STYLE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Styl API', 'Styl protokołu i interakcji API', 'system'
FROM atlas.dictionary_type WHERE code = 'API_STYLE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Metoda uwierzytelniania', 'Mechanizmy uwierzytelniania obsługiwane przez API', 'system'
FROM atlas.dictionary_type WHERE code = 'AUTHENTICATION_METHOD';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Wzorzec integracyjny', 'Wzorce integracji korporacyjnej', 'system'
FROM atlas.dictionary_type WHERE code = 'INTEGRATION_PATTERN';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Protokół', 'Protokoły komunikacyjne', 'system'
FROM atlas.dictionary_type WHERE code = 'PROTOCOL';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Format komunikatu', 'Formaty serializacji ładunku danych', 'system'
FROM atlas.dictionary_type WHERE code = 'MESSAGE_FORMAT';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Model wdrożenia', 'Modele topologii wdrożenia', 'system'
FROM atlas.dictionary_type WHERE code = 'DEPLOYMENT_MODEL';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Środowisko uruchomieniowe', 'Środowiska hostingowe runtime', 'system'
FROM atlas.dictionary_type WHERE code = 'RUNTIME_ENVIRONMENT';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Zgodność regulacyjna', 'Standardy zgodności i regulacyjne', 'system'
FROM atlas.dictionary_type WHERE code = 'COMPLIANCE';

-- SYSTEM_OWNER_ROLE has Polish canonical name — add English translation
INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'en', 'System Owner Role', 'Defines the type of responsibility of a person assigned to an IT system', 'system'
FROM atlas.dictionary_type WHERE code = 'SYSTEM_OWNER_ROLE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Zakres systemu', 'Klasyfikuje system jako wewnętrzny, zewnętrzny lub zewnętrzną organizację', 'system'
FROM atlas.dictionary_type WHERE code = 'SYSTEM_SCOPE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Typ API', 'Klasyfikacja protokołu i stylu interakcji API', 'system'
FROM atlas.dictionary_type WHERE code = 'API_TYPE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Status API', 'Status cyklu życia API', 'system'
FROM atlas.dictionary_type WHERE code = 'API_STATUS';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Typ kontraktu', 'Format kontraktu lub dokumentu specyfikacji API', 'system'
FROM atlas.dictionary_type WHERE code = 'CONTRACT_TYPE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Polityka bezpieczeństwa', 'Polityka bezpieczeństwa stosowana wobec API', 'system'
FROM atlas.dictionary_type WHERE code = 'SECURITY_POLICY';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Poziom SLA', 'Poziom umowy o poziomie usług dla API', 'system'
FROM atlas.dictionary_type WHERE code = 'SLA_TIER';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Rola właściciela API', 'Rola właściciela lub interesariusza w cyklu życia API', 'system'
FROM atlas.dictionary_type WHERE code = 'API_OWNER_ROLE';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Grupa domeny danych', 'Kategoria grupowania wysokiego poziomu dla domen danych', 'system'
FROM atlas.dictionary_type WHERE code = 'DATA_DOMAIN_GROUP';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Środowisko API', 'Środowiska wdrożeniowe, w których dostępne jest API', 'system'
FROM atlas.dictionary_type WHERE code = 'API_ENVIRONMENT';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Kierunek przepływu danych', 'Kierunek przepływu danych między systemami producenta i konsumenta w integracji API', 'system'
FROM atlas.dictionary_type WHERE code = 'DATA_FLOW_DIRECTION';

INSERT INTO atlas.dictionary_type_translation (type_id, lang_code, name, description, created_by)
SELECT id, 'pl', 'Status załącznika', 'Status cyklu życia dokumentów załączników API', 'system'
FROM atlas.dictionary_type WHERE code = 'ATTACHMENT_STATUS';

-- =============================================================================
-- DICTIONARY ENTRY TRANSLATIONS — Polish (pl)
-- Entries with English canonical names get Polish translations.
-- =============================================================================

-- SYSTEM_STATUS
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wersja robocza', 'Definicja systemu w przygotowaniu', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_STATUS' AND de.code = 'DRAFT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Aktywny', 'System jest w eksploatacji i jest wspierany', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_STATUS' AND de.code = 'ACTIVE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Przestarzały', 'System nie powinien być używany w nowych integracjach', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_STATUS' AND de.code = 'DEPRECATED';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wycofany', 'System został wycofany z eksploatacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_STATUS' AND de.code = 'RETIRED';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Planowany', 'System zaplanowany do przyszłej implementacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_STATUS' AND de.code = 'PLANNED';

-- LIFECYCLE_STAGE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Analiza', 'Faza analizy biznesowej i technicznej', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'ANALYSIS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Rozwój', 'Faza implementacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'DEVELOPMENT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Testy', 'Faza testów i zapewnienia jakości', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'TESTING';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Pilot', 'Faza wdrożenia pilotowego', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'PILOT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Produkcja', 'Etap produkcyjny', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'PRODUCTION';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wygaszanie', 'Przygotowanie do wygaszenia i wycofania', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'SUNSET';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wycofany', 'System wycofany', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'LIFECYCLE_STAGE' AND de.code = 'RETIRED';

-- BUSINESS_CRITICALITY
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Niski', 'Minimalny wpływ na biznes', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'BUSINESS_CRITICALITY' AND de.code = 'LOW';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Średni', 'Umiarkowany wpływ na biznes', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'BUSINESS_CRITICALITY' AND de.code = 'MEDIUM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wysoki', 'Znaczący wpływ na biznes', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'BUSINESS_CRITICALITY' AND de.code = 'HIGH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Krytyczny', 'System o krytycznym znaczeniu dla działalności', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'BUSINESS_CRITICALITY' AND de.code = 'CRITICAL';

-- DATA_CLASSIFICATION
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Publiczny', 'Informacje dostępne publicznie', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_CLASSIFICATION' AND de.code = 'PUBLIC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wewnętrzny', 'Dane wewnętrzne organizacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_CLASSIFICATION' AND de.code = 'INTERNAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Poufny', 'Wrażliwe dane poufne', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_CLASSIFICATION' AND de.code = 'CONFIDENTIAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Ściśle poufny', 'Wysoce wrażliwe, ograniczone dane', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_CLASSIFICATION' AND de.code = 'STRICTLY_CONFIDENTIAL';

-- SYSTEM_TYPE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'System podstawowy', 'Podstawowy system przedsiębiorstwa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'CORE_SYSTEM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'System satelitarny', 'System wspierający', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'SATELLITE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Brama API', 'Platforma bramy API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'API_GATEWAY';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Mikroserwis', 'Aplikacja mikroserwisowa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'MICROSERVICE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'System dziedziczny', 'System dziedziczny (legacy)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'LEGACY';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SaaS', 'Oprogramowanie jako usługa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'SAAS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'ETL', 'Silnik ETL lub integracyjny', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'ETL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Platforma danych', 'Platforma przetwarzania danych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'DATA_PLATFORM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Platforma zdarzeń', 'Platforma strumieniowania zdarzeń', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'EVENT_PLATFORM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Backend mobilny', 'Backend dla aplikacji mobilnych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_TYPE' AND de.code = 'MOBILE_BACKEND';

-- ARCHITECTURE_STYLE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Monolit', 'Architektura monolityczna', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'MONOLITH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Mikroserwisy', 'Architektura mikroserwisowa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'MICROSERVICES';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Sterowany zdarzeniami', 'Architektura sterowana zdarzeniami', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'EVENT_DRIVEN';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SOA', 'Architektura zorientowana na usługi', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'SOA';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Bezserwerowy', 'Architektura bezserwerowa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'SERVERLESS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Modularny monolit', 'Modularna architektura monolityczna', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'MODULAR_MONOLITH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Heksagonalna', 'Architektura heksagonalna', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ARCHITECTURE_STYLE' AND de.code = 'HEXAGONAL';

-- API_STYLE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'REST', 'API RESTful', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'REST';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SOAP', 'Usługa Web SOAP', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'SOAP';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'GraphQL', 'API GraphQL', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'GRAPHQL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'gRPC', 'API gRPC', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'GRPC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'AsyncAPI', 'Specyfikacja AsyncAPI', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'ASYNC_API';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'WebSocket', 'API WebSocket', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STYLE' AND de.code = 'WEBSOCKET';

-- AUTHENTICATION_METHOD
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Uwierzytelnianie podstawowe', 'Uwierzytelnianie HTTP Basic', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'BASIC_AUTH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Klucz API', 'Uwierzytelnianie kluczem API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'API_KEY';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'OAuth2', 'Uwierzytelnianie OAuth2', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'OAUTH2';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'OIDC', 'OpenID Connect', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'OIDC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SAML', 'Uwierzytelnianie SAML', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'SAML';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'mTLS', 'Wzajemny TLS', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'MTLS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'JWT', 'Uwierzytelnianie tokenem JWT', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'AUTHENTICATION_METHOD' AND de.code = 'JWT';

-- INTEGRATION_PATTERN
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Żądanie-odpowiedź', 'Synchroniczna komunikacja żądanie-odpowiedź', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'REQUEST_RESPONSE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Pub/Sub', 'Integracja publikuj-subskrybuj', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'PUB_SUB';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Strumień zdarzeń', 'Integracja strumieniowania zdarzeń', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'EVENT_STREAM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Transfer plików', 'Integracja wsadowa przez transfer plików', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'FILE_TRANSFER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'CDC', 'Przechwytywanie zmian danych (Change Data Capture)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'CDC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Webhook', 'Integracja przez webhook', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'WEBHOOK';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wsadowy', 'Wsadowe przetwarzanie integracji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'BATCH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Kolejka wiadomości', 'Integracja przez kolejkę wiadomości', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'INTEGRATION_PATTERN' AND de.code = 'MESSAGE_QUEUE';

-- PROTOCOL
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'HTTP', 'Protokół HTTP', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'HTTP';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'HTTPS', 'Bezpieczny protokół HTTP', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'HTTPS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'AMQP', 'Zaawansowany protokół kolejkowania wiadomości', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'AMQP';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'MQTT', 'Protokół przesyłania wiadomości MQTT', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'MQTT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Kafka', 'Protokół Apache Kafka', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'KAFKA';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'JMS', 'Java Message Service', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'JMS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'FTP', 'Protokół transferu plików', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'FTP';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SFTP', 'Bezpieczny protokół transferu plików', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'PROTOCOL' AND de.code = 'SFTP';

-- MESSAGE_FORMAT
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'JSON', 'JavaScript Object Notation', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'JSON';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'XML', 'Rozszerzalny język znaczników', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'XML';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Avro', 'Format Apache Avro', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'AVRO';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Protocol Buffers', 'Google Protocol Buffers', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'PROTOBUF';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'CSV', 'Wartości rozdzielone przecinkami', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'CSV';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'EDI', 'Elektroniczna wymiana danych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'MESSAGE_FORMAT' AND de.code = 'EDI';

-- DEPLOYMENT_MODEL
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Na miejscu (on-premise)', 'Wdrożenie lokalne', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DEPLOYMENT_MODEL' AND de.code = 'ON_PREMISE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Chmura prywatna', 'Wdrożenie w chmurze prywatnej', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DEPLOYMENT_MODEL' AND de.code = 'PRIVATE_CLOUD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Chmura publiczna', 'Wdrożenie w chmurze publicznej', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DEPLOYMENT_MODEL' AND de.code = 'PUBLIC_CLOUD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Hybrydowy', 'Hybrydowy model wdrożenia', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DEPLOYMENT_MODEL' AND de.code = 'HYBRID';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SaaS', 'Wdrożenie jako oprogramowanie usługowe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DEPLOYMENT_MODEL' AND de.code = 'SAAS';

-- RUNTIME_ENVIRONMENT
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Kubernetes', 'Środowisko uruchomieniowe Kubernetes', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'RUNTIME_ENVIRONMENT' AND de.code = 'KUBERNETES';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Maszyna wirtualna', 'Środowisko maszyny wirtualnej', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'RUNTIME_ENVIRONMENT' AND de.code = 'VM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Serwer fizyczny', 'Środowisko serwera fizycznego (bare metal)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'RUNTIME_ENVIRONMENT' AND de.code = 'BARE_METAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Bezserwerowy', 'Środowisko bezserwerowe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'RUNTIME_ENVIRONMENT' AND de.code = 'SERVERLESS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Mainframe', 'Środowisko mainframe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'RUNTIME_ENVIRONMENT' AND de.code = 'MAINFRAME';

-- COMPLIANCE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'RODO', 'Ogólne rozporządzenie o ochronie danych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'GDPR';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'PCI DSS', 'Standard bezpieczeństwa danych branży kart płatniczych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'PCI_DSS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SOX', 'Ustawa Sarbanes-Oxley', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'SOX';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'HIPAA', 'Ustawa o przenośności i odpowiedzialności w ubezpieczeniach zdrowotnych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'HIPAA';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'PSD2', 'Dyrektywa o usługach płatniczych 2', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'PSD2';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'ISO 27001', 'ISO/IEC 27001 Bezpieczeństwo informacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'COMPLIANCE' AND de.code = 'ISO27001';

-- SYSTEM_OWNER_ROLE — canonical names are Polish; add English translations
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'Business Owner', 'Person responsible for the system on the business side', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'BUSINESS_OWNER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'Technical Owner', 'Person responsible for the technical layer of the system', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'TECHNICAL_OWNER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'System Administrator', 'Person managing the day-to-day operation of the system', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'SYSTEM_ADMIN';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'Solution Architect', 'Person responsible for the architecture and technical direction', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'ARCHITECT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'Security Officer', 'Person responsible for system security and compliance', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'SECURITY_OFFICER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'en', 'Product Owner', 'Person managing the product backlog and prioritization', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_OWNER_ROLE' AND de.code = 'PRODUCT_OWNER';

-- SYSTEM_SCOPE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'System wewnętrzny', 'System eksploatowany i posiadany przez przedsiębiorstwo', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_SCOPE' AND de.code = 'INTERNAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'System zewnętrzny', 'System dostarczony przez inną organizację lub przedsiębiorstwo', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_SCOPE' AND de.code = 'EXTERNAL_SYSTEM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Organizacja zewnętrzna', 'Zewnętrzna organizacja lub instytucja (np. NBP, KIR)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SYSTEM_SCOPE' AND de.code = 'EXTERNAL_ORGANIZATION';

-- API_TYPE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'REST', 'API HTTP RESTful', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'REST';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SOAP', 'Usługa Web SOAP', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'SOAP';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'GraphQL', 'API GraphQL', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'GRAPHQL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'gRPC', 'API gRPC używające Protocol Buffers', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'GRPC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'WebSocket', 'API WebSocket czasu rzeczywistego', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'WEBSOCKET';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'AsyncAPI', 'Asynchroniczne API opisane przez AsyncAPI', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'ASYNCAPI';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'EDI', 'Elektroniczna wymiana danych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'EDI';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Plik wsadowy', 'Integracja oparta na plikach wsadowych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'BATCH_FILE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Zdarzenie', 'Integracja sterowana zdarzeniami', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'EVENT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Inne', 'Inny typ API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_TYPE' AND de.code = 'OTHER';

-- API_STATUS
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wersja robocza', 'API jest w fazie projektu / projektowania', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STATUS' AND de.code = 'DRAFT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Aktywny', 'API jest aktywne i dostępne dla konsumentów', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STATUS' AND de.code = 'ACTIVE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Przestarzały', 'API jest przestarzałe; niezalecane dla nowych konsumentów', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STATUS' AND de.code = 'DEPRECATED';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wycofany', 'API zostało wycofane z eksploatacji', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STATUS' AND de.code = 'RETIRED';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Zawieszony', 'API jest tymczasowo zawieszone', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_STATUS' AND de.code = 'SUSPENDED';

-- CONTRACT_TYPE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'OpenAPI 3', 'Specyfikacja OpenAPI 3.x', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'OPENAPI_3';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Swagger 2', 'Specyfikacja Swagger / OpenAPI 2.0', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'SWAGGER_2';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'WSDL', 'Język opisu usług sieciowych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'WSDL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Schemat GraphQL', 'Plik schematu GraphQL SDL', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'GRAPHQL_SCHEMA';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'AsyncAPI', 'Specyfikacja AsyncAPI', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'ASYNCAPI';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Protobuf', 'Plik Protocol Buffers .proto', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'PROTOBUF';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'RAML', 'Język modelowania API RESTful', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'RAML';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Kolekcja Postman', 'Eksport kolekcji Postman', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'POSTMAN_COLLECTION';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'XSD', 'Definicja schematu XML', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'XSD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Inne', 'Inny format kontraktu', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'CONTRACT_TYPE' AND de.code = 'OTHER';

-- SECURITY_POLICY
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Brak', 'Brak wymuszanej polityki bezpieczeństwa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'NONE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Klucz API', 'Kontrola dostępu oparta na kluczu API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'API_KEY';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'OAuth2', 'Polityka bezpieczeństwa oparta na tokenie OAuth2', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'OAUTH2';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'JWT', 'Walidacja tokenu bearer JWT', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'JWT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'mTLS', 'Polityka certyfikatu klienta Mutual TLS', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'MTLS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'TLS', 'Tylko szyfrowanie transportu TLS', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'TLS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Uwierzytelnianie podstawowe', 'Polityka uwierzytelniania HTTP Basic', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'BASIC_AUTH';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'HMAC', 'Polityka podpisywania żądań HMAC', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'HMAC';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Lista dozwolonych adresów IP', 'Kontrola dostępu przez listę dozwolonych IP', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'IP_WHITELIST';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Niestandardowy', 'Niestandardowa lub zastrzeżona polityka bezpieczeństwa', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SECURITY_POLICY' AND de.code = 'CUSTOM';

-- SLA_TIER
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Platyna', 'Najwyższy poziom SLA: 99,99% dostępności, wsparcie krytyczne', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SLA_TIER' AND de.code = 'PLATINUM';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Złoto', 'Poziom złoty SLA: 99,9% dostępności, wsparcie priorytetowe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SLA_TIER' AND de.code = 'GOLD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Srebro', 'Poziom srebrny SLA: 99,5% dostępności, wsparcie standardowe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SLA_TIER' AND de.code = 'SILVER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Brąz', 'Poziom brązowy SLA: 99% dostępności, wsparcie best-effort', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SLA_TIER' AND de.code = 'BRONZE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Najlepsza możliwa obsługa', 'Brak formalnego SLA; dostawa na zasadzie best-effort', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'SLA_TIER' AND de.code = 'BEST_EFFORT';

-- API_OWNER_ROLE
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Właściciel', 'Biznesowy lub techniczny właściciel API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'OWNER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Lider techniczny', 'Lider techniczny odpowiedzialny za API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'TECHNICAL_LEAD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Deweloper', 'Deweloper uczestniczący w rozwoju API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'DEVELOPER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Konsument', 'Przedstawiciel zespołu konsumenta API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'CONSUMER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Recenzent', 'Recenzent ładu zarządzania lub architektury', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'REVIEWER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Oficer bezpieczeństwa', 'Oficer zgodności bezpieczeństwa dla API', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_OWNER_ROLE' AND de.code = 'SECURITY_OFFICER';

-- DATA_DOMAIN_GROUP
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Finanse', 'Dane finansowe: transakcje, budżety, rachunkowość', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'FINANCE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Klient', 'Dane klientów: profile, kontakty, CRM', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'CUSTOMER';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Produkt', 'Katalog produktów, stany magazynowe, ceny', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'PRODUCT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Operacje', 'Dane operacyjne: logistyka, łańcuch dostaw, realizacja', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'OPERATIONS';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'HR', 'Zasoby ludzkie: pracownicy, struktura organizacyjna, płace', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'HR';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Marketing', 'Dane marketingowe i kampanijne, grupy odbiorców, analityka', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'MARKETING';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Zgodność', 'Dane regulacyjne i zgodności, logi audytu, RODO', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'COMPLIANCE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Techniczne', 'Metadane techniczne, infrastruktura, dane platformy', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'TECHNICAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Bezpieczeństwo', 'Zdarzenia bezpieczeństwa, logi dostępu, dane tożsamości', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'SECURITY';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Inne', 'Dane niesklasyfikowane lub wielodziedzinowe', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_DOMAIN_GROUP' AND de.code = 'OTHER';

-- API_ENVIRONMENT
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Lokalne', 'Środowisko lokalne dewelopera', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'LOCAL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Deweloperskie', 'Środowisko deweloperskie', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'DEV';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Testowe', 'Środowisko testów automatycznych', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'TEST';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'SIT', 'Środowisko testów integracyjnych systemów', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'SIT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'UAT', 'Środowisko testów akceptacyjnych użytkownika', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'UAT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Staging', 'Środowisko stagingowe / lustrzane pre-produkcja', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'STAGING';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Pre-produkcja', 'Środowisko przed-produkcyjne', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'PREPROD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Produkcja', 'Środowisko produkcyjne', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'PROD';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'DR', 'Środowisko odtwarzania po awarii', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'API_ENVIRONMENT' AND de.code = 'DR';

-- DATA_FLOW_DIRECTION
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Pobieranie (Producent → Konsument)', 'Konsument pobiera / odczytuje dane od producenta (klasyczne żądanie-odpowiedź, polling)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_FLOW_DIRECTION' AND de.code = 'PULL';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wysyłanie (Konsument → Producent)', 'Konsument wysyła / dostarcza dane do producenta (callbacki, webhook, publikowanie zdarzeń)', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'DATA_FLOW_DIRECTION' AND de.code = 'PUSH';

-- ATTACHMENT_STATUS
INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Wersja robocza', 'Dokument jest roboczym projektem, nie został jeszcze zrecenzowany', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ATTACHMENT_STATUS' AND de.code = 'DRAFT';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'W recenzji', 'Dokument oczekuje na recenzję lub zatwierdzenie', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ATTACHMENT_STATUS' AND de.code = 'UNDER_REVIEW';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Aktywny', 'Dokument jest zatwierdzony i aktualnie używany', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ATTACHMENT_STATUS' AND de.code = 'ACTIVE';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Przestarzały', 'Dokument jest nieaktualny i zastąpiony przez nowszą wersję', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ATTACHMENT_STATUS' AND de.code = 'DEPRECATED';

INSERT INTO atlas.dictionary_entry_translation (entry_id, lang_code, name, description, created_by)
SELECT de.id, 'pl', 'Zarchiwizowany', 'Dokument został zarchiwizowany i nie jest już używany', 'system'
FROM atlas.dictionary_entry de JOIN atlas.dictionary_type dt ON dt.id = de.dictionary_type_id
WHERE dt.code = 'ATTACHMENT_STATUS' AND de.code = 'ARCHIVED';
