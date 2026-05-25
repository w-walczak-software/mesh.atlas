-- ============================================================================
-- V0.0018__20260525_api_dictionaries.sql
-- API Registry - Dictionary Types and Seed Data
-- ============================================================================

-- ============================================================================
-- DICTIONARY TYPES
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
VALUES

-- API TYPE
(
    gen_random_uuid(),
    'API_TYPE',
    'API Type',
    'Classification of API protocol and interaction style',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- API STATUS
(
    gen_random_uuid(),
    'API_STATUS',
    'API Status',
    'Lifecycle status of an API',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- CONTRACT TYPE
(
    gen_random_uuid(),
    'CONTRACT_TYPE',
    'Contract Type',
    'Format of the API contract or specification document',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- SECURITY POLICY
(
    gen_random_uuid(),
    'SECURITY_POLICY',
    'Security Policy',
    'Security enforcement policy applied to the API',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- SLA TIER
(
    gen_random_uuid(),
    'SLA_TIER',
    'SLA Tier',
    'Service Level Agreement tier for the API',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- API OWNER ROLE
(
    gen_random_uuid(),
    'API_OWNER_ROLE',
    'API Owner Role',
    'Role of an owner or stakeholder in the API lifecycle',
    TRUE,
    TRUE,
    now(),
    'system'
);

-- ============================================================================
-- API_TYPE
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
        ('REST',        'REST',        'RESTful HTTP API',                           1),
        ('SOAP',        'SOAP',        'SOAP Web Service',                           2),
        ('GRAPHQL',     'GraphQL',     'GraphQL API',                                3),
        ('GRPC',        'gRPC',        'gRPC API using Protocol Buffers',            4),
        ('WEBSOCKET',   'WebSocket',   'WebSocket real-time API',                    5),
        ('ASYNCAPI',    'AsyncAPI',    'Asynchronous API described by AsyncAPI',     6),
        ('EDI',         'EDI',         'Electronic Data Interchange',                7),
        ('BATCH_FILE',  'Batch File',  'Batch file-based integration',               8),
        ('EVENT',       'Event',       'Event-driven integration',                   9),
        ('OTHER',       'Other',       'Other API type',                             10)
) AS v(code, name, description, display_order)
WHERE dt.code = 'API_TYPE';

-- ============================================================================
-- API_STATUS
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
        ('DRAFT',      'Draft',      'API is in draft / design phase',             1),
        ('ACTIVE',     'Active',     'API is live and available for consumption',  2),
        ('DEPRECATED', 'Deprecated', 'API is deprecated; avoid for new consumers', 3),
        ('RETIRED',    'Retired',    'API has been decommissioned',                4),
        ('SUSPENDED',  'Suspended',  'API is temporarily suspended',               5)
) AS v(code, name, description, display_order)
WHERE dt.code = 'API_STATUS';

-- ============================================================================
-- CONTRACT_TYPE
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
        ('OPENAPI_3',           'OpenAPI 3',            'OpenAPI 3.x specification',          1),
        ('SWAGGER_2',           'Swagger 2',            'Swagger / OpenAPI 2.0 specification', 2),
        ('WSDL',                'WSDL',                 'Web Services Description Language',  3),
        ('GRAPHQL_SCHEMA',      'GraphQL Schema',       'GraphQL SDL schema file',            4),
        ('ASYNCAPI',            'AsyncAPI',             'AsyncAPI specification',              5),
        ('PROTOBUF',            'Protobuf',             'Protocol Buffers .proto file',        6),
        ('RAML',                'RAML',                 'RESTful API Modeling Language',       7),
        ('POSTMAN_COLLECTION',  'Postman Collection',   'Postman Collection export',           8),
        ('XSD',                 'XSD',                  'XML Schema Definition',               9),
        ('OTHER',               'Other',                'Other contract format',               10)
) AS v(code, name, description, display_order)
WHERE dt.code = 'CONTRACT_TYPE';

-- ============================================================================
-- SECURITY_POLICY
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
        ('NONE',          'None',          'No security policy enforced',              1),
        ('API_KEY',       'API Key',       'API key-based access control',             2),
        ('OAUTH2',        'OAuth2',        'OAuth2 token-based security policy',       3),
        ('JWT',           'JWT',           'JWT bearer token validation',              4),
        ('MTLS',          'mTLS',          'Mutual TLS client certificate policy',     5),
        ('TLS',           'TLS',           'TLS transport encryption only',            6),
        ('BASIC_AUTH',    'Basic Auth',    'HTTP Basic Authentication policy',         7),
        ('HMAC',          'HMAC',          'HMAC request signing policy',              8),
        ('IP_WHITELIST',  'IP Whitelist',  'IP address whitelist access control',      9),
        ('CUSTOM',        'Custom',        'Custom or proprietary security policy',    10)
) AS v(code, name, description, display_order)
WHERE dt.code = 'SECURITY_POLICY';

-- ============================================================================
-- SLA_TIER
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
        ('PLATINUM',     'Platinum',     'Highest SLA tier: 99.99% uptime, critical support', 1),
        ('GOLD',         'Gold',         'Gold SLA tier: 99.9% uptime, priority support',      2),
        ('SILVER',       'Silver',       'Silver SLA tier: 99.5% uptime, standard support',   3),
        ('BRONZE',       'Bronze',       'Bronze SLA tier: 99% uptime, best-effort support',  4),
        ('BEST_EFFORT',  'Best Effort',  'No formal SLA; best-effort delivery',               5)
) AS v(code, name, description, display_order)
WHERE dt.code = 'SLA_TIER';

-- ============================================================================
-- API_OWNER_ROLE
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
        ('OWNER',             'Owner',             'Business or technical owner of the API',    1),
        ('TECHNICAL_LEAD',    'Technical Lead',    'Technical lead responsible for the API',    2),
        ('DEVELOPER',         'Developer',         'Developer contributing to the API',         3),
        ('CONSUMER',          'Consumer',          'API consumer team representative',          4),
        ('REVIEWER',          'Reviewer',          'Governance or architecture reviewer',       5),
        ('SECURITY_OFFICER',  'Security Officer',  'Security compliance officer for the API',  6)
) AS v(code, name, description, display_order)
WHERE dt.code = 'API_OWNER_ROLE';
