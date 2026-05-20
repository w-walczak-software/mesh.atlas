-- ============================================================================
-- V2__seed_enterprise_dictionaries.sql
-- Enterprise API Registry - Dictionary Seed Data
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

-- SYSTEM STATUS
(
    gen_random_uuid(),
    'SYSTEM_STATUS',
    'System Status',
    'Lifecycle status of IT systems',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- LIFECYCLE STAGE
(
    gen_random_uuid(),
    'LIFECYCLE_STAGE',
    'Lifecycle Stage',
    'Software delivery lifecycle stages',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- BUSINESS CRITICALITY
(
    gen_random_uuid(),
    'BUSINESS_CRITICALITY',
    'Business Criticality',
    'Business impact level of a system',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- DATA CLASSIFICATION
(
    gen_random_uuid(),
    'DATA_CLASSIFICATION',
    'Data Classification',
    'Sensitivity classification of processed data',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- SYSTEM TYPE
(
    gen_random_uuid(),
    'SYSTEM_TYPE',
    'System Type',
    'Classification of IT systems',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- ARCHITECTURE STYLE
(
    gen_random_uuid(),
    'ARCHITECTURE_STYLE',
    'Architecture Style',
    'Software architecture styles',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- API STYLE
(
    gen_random_uuid(),
    'API_STYLE',
    'API Style',
    'API protocol and interaction style',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- AUTHENTICATION METHOD
(
    gen_random_uuid(),
    'AUTHENTICATION_METHOD',
    'Authentication Method',
    'Authentication mechanisms supported by APIs',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- INTEGRATION PATTERN
(
    gen_random_uuid(),
    'INTEGRATION_PATTERN',
    'Integration Pattern',
    'Enterprise integration patterns',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- PROTOCOL
(
    gen_random_uuid(),
    'PROTOCOL',
    'Protocol',
    'Communication protocols',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- MESSAGE FORMAT
(
    gen_random_uuid(),
    'MESSAGE_FORMAT',
    'Message Format',
    'Payload serialization formats',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- DEPLOYMENT MODEL
(
    gen_random_uuid(),
    'DEPLOYMENT_MODEL',
    'Deployment Model',
    'Deployment topology models',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- RUNTIME ENVIRONMENT
(
    gen_random_uuid(),
    'RUNTIME_ENVIRONMENT',
    'Runtime Environment',
    'Runtime hosting environments',
    TRUE,
    TRUE,
    now(),
    'system'
),

-- COMPLIANCE
(
    gen_random_uuid(),
    'COMPLIANCE',
    'Compliance',
    'Compliance and regulatory frameworks',
    TRUE,
    TRUE,
    now(),
    'system'
);

-- ============================================================================
-- SYSTEM STATUS
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
        ('DRAFT', 'Draft', 'System definition in preparation', 1),
        ('ACTIVE', 'Active', 'System is operational and supported', 2),
        ('DEPRECATED', 'Deprecated', 'System should not be used for new integrations', 3),
        ('RETIRED', 'Retired', 'System has been decommissioned', 4),
        ('PLANNED', 'Planned', 'System planned for future implementation', 5)
) AS v(code, name, description, display_order)
WHERE dt.code = 'SYSTEM_STATUS';

-- ============================================================================
-- LIFECYCLE STAGE
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
        ('ANALYSIS', 'Analysis', 'Business and technical analysis phase', 1),
        ('DEVELOPMENT', 'Development', 'Implementation phase', 2),
        ('TESTING', 'Testing', 'Testing and quality assurance phase', 3),
        ('PILOT', 'Pilot', 'Pilot rollout phase', 4),
        ('PRODUCTION', 'Production', 'Live production stage', 5),
        ('SUNSET', 'Sunset', 'Sunset and retirement preparation', 6),
        ('RETIRED', 'Retired', 'System retired', 7)
) AS v(code, name, description, display_order)
WHERE dt.code = 'LIFECYCLE_STAGE';

-- ============================================================================
-- BUSINESS CRITICALITY
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
        ('LOW', 'Low', 'Minimal business impact', 1),
        ('MEDIUM', 'Medium', 'Moderate business impact', 2),
        ('HIGH', 'High', 'Significant business impact', 3),
        ('CRITICAL', 'Critical', 'Mission critical system', 4)
) AS v(code, name, description, display_order)
WHERE dt.code = 'BUSINESS_CRITICALITY';

-- ============================================================================
-- DATA CLASSIFICATION
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
        ('PUBLIC', 'Public', 'Publicly available information', 1),
        ('INTERNAL', 'Internal', 'Internal organization data', 2),
        ('CONFIDENTIAL', 'Confidential', 'Sensitive confidential data', 3),
        ('STRICTLY_CONFIDENTIAL', 'Strictly Confidential', 'Highly sensitive restricted data', 4)
) AS v(code, name, description, display_order)
WHERE dt.code = 'DATA_CLASSIFICATION';

-- ============================================================================
-- SYSTEM TYPE
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
        ('CORE_SYSTEM', 'Core System', 'Core enterprise system', 1),
        ('SATELLITE', 'Satellite', 'Supporting system', 2),
        ('API_GATEWAY', 'API Gateway', 'API gateway platform', 3),
        ('MICROSERVICE', 'Microservice', 'Microservice application', 4),
        ('LEGACY', 'Legacy', 'Legacy system', 5),
        ('SAAS', 'SaaS', 'Software as a Service', 6),
        ('ETL', 'ETL', 'ETL or integration engine', 7),
        ('DATA_PLATFORM', 'Data Platform', 'Data processing platform', 8),
        ('EVENT_PLATFORM', 'Event Platform', 'Event streaming platform', 9),
        ('MOBILE_BACKEND', 'Mobile Backend', 'Backend for mobile applications', 10)
) AS v(code, name, description, display_order)
WHERE dt.code = 'SYSTEM_TYPE';

-- ============================================================================
-- ARCHITECTURE STYLE
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
        ('MONOLITH', 'Monolith', 'Monolithic architecture', 1),
        ('MICROSERVICES', 'Microservices', 'Microservices architecture', 2),
        ('EVENT_DRIVEN', 'Event Driven', 'Event-driven architecture', 3),
        ('SOA', 'SOA', 'Service-oriented architecture', 4),
        ('SERVERLESS', 'Serverless', 'Serverless architecture', 5),
        ('MODULAR_MONOLITH', 'Modular Monolith', 'Modular monolithic architecture', 6),
        ('HEXAGONAL', 'Hexagonal', 'Hexagonal architecture', 7)
) AS v(code, name, description, display_order)
WHERE dt.code = 'ARCHITECTURE_STYLE';

-- ============================================================================
-- API STYLE
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
        ('REST', 'REST', 'RESTful API', 1),
        ('SOAP', 'SOAP', 'SOAP Web Service', 2),
        ('GRAPHQL', 'GraphQL', 'GraphQL API', 3),
        ('GRPC', 'gRPC', 'gRPC API', 4),
        ('ASYNC_API', 'AsyncAPI', 'AsyncAPI specification', 5),
        ('WEBSOCKET', 'WebSocket', 'WebSocket API', 6)
) AS v(code, name, description, display_order)
WHERE dt.code = 'API_STYLE';

-- ============================================================================
-- AUTHENTICATION METHOD
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
        ('BASIC_AUTH', 'Basic Auth', 'HTTP Basic Authentication', 1),
        ('API_KEY', 'API Key', 'API Key Authentication', 2),
        ('OAUTH2', 'OAuth2', 'OAuth2 Authentication', 3),
        ('OIDC', 'OIDC', 'OpenID Connect', 4),
        ('SAML', 'SAML', 'SAML Authentication', 5),
        ('MTLS', 'mTLS', 'Mutual TLS', 6),
        ('JWT', 'JWT', 'JWT Token Authentication', 7)
) AS v(code, name, description, display_order)
WHERE dt.code = 'AUTHENTICATION_METHOD';

-- ============================================================================
-- INTEGRATION PATTERN
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
        ('REQUEST_RESPONSE', 'Request Response', 'Synchronous request-response communication', 1),
        ('PUB_SUB', 'Pub/Sub', 'Publish-subscribe integration', 2),
        ('EVENT_STREAM', 'Event Stream', 'Event streaming integration', 3),
        ('FILE_TRANSFER', 'File Transfer', 'Batch file transfer integration', 4),
        ('CDC', 'CDC', 'Change Data Capture', 5),
        ('WEBHOOK', 'Webhook', 'Webhook integration', 6),
        ('BATCH', 'Batch', 'Batch integration processing', 7),
        ('MESSAGE_QUEUE', 'Message Queue', 'Queue-based messaging integration', 8)
) AS v(code, name, description, display_order)
WHERE dt.code = 'INTEGRATION_PATTERN';

-- ============================================================================
-- PROTOCOL
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
        ('HTTP', 'HTTP', 'HTTP Protocol', 1),
        ('HTTPS', 'HTTPS', 'Secure HTTP Protocol', 2),
        ('AMQP', 'AMQP', 'Advanced Message Queuing Protocol', 3),
        ('MQTT', 'MQTT', 'MQTT Messaging Protocol', 4),
        ('KAFKA', 'Kafka', 'Apache Kafka Protocol', 5),
        ('JMS', 'JMS', 'Java Message Service', 6),
        ('FTP', 'FTP', 'File Transfer Protocol', 7),
        ('SFTP', 'SFTP', 'Secure File Transfer Protocol', 8)
) AS v(code, name, description, display_order)
WHERE dt.code = 'PROTOCOL';

-- ============================================================================
-- MESSAGE FORMAT
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
        ('JSON', 'JSON', 'JavaScript Object Notation', 1),
        ('XML', 'XML', 'Extensible Markup Language', 2),
        ('AVRO', 'Avro', 'Apache Avro Format', 3),
        ('PROTOBUF', 'Protocol Buffers', 'Google Protocol Buffers', 4),
        ('CSV', 'CSV', 'Comma-separated values', 5),
        ('EDI', 'EDI', 'Electronic Data Interchange', 6)
) AS v(code, name, description, display_order)
WHERE dt.code = 'MESSAGE_FORMAT';

-- ============================================================================
-- DEPLOYMENT MODEL
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
        ('ON_PREMISE', 'On Premise', 'On-premise deployment', 1),
        ('PRIVATE_CLOUD', 'Private Cloud', 'Private cloud deployment', 2),
        ('PUBLIC_CLOUD', 'Public Cloud', 'Public cloud deployment', 3),
        ('HYBRID', 'Hybrid', 'Hybrid deployment model', 4),
        ('SAAS', 'SaaS', 'Software as a Service deployment', 5)
) AS v(code, name, description, display_order)
WHERE dt.code = 'DEPLOYMENT_MODEL';

-- ============================================================================
-- RUNTIME ENVIRONMENT
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
        ('KUBERNETES', 'Kubernetes', 'Kubernetes runtime environment', 1),
        ('VM', 'Virtual Machine', 'Virtual machine runtime', 2),
        ('BARE_METAL', 'Bare Metal', 'Bare metal runtime environment', 3),
        ('SERVERLESS', 'Serverless', 'Serverless runtime', 4),
        ('MAINFRAME', 'Mainframe', 'Mainframe environment', 5)
) AS v(code, name, description, display_order)
WHERE dt.code = 'RUNTIME_ENVIRONMENT';

-- ============================================================================
-- COMPLIANCE
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
        ('GDPR', 'GDPR', 'General Data Protection Regulation', 1),
        ('PCI_DSS', 'PCI DSS', 'Payment Card Industry Data Security Standard', 2),
        ('SOX', 'SOX', 'Sarbanes-Oxley Act', 3),
        ('HIPAA', 'HIPAA', 'Health Insurance Portability and Accountability Act', 4),
        ('PSD2', 'PSD2', 'Payment Services Directive 2', 5),
        ('ISO27001', 'ISO 27001', 'ISO/IEC 27001 Information Security', 6)
) AS v(code, name, description, display_order)
WHERE dt.code = 'COMPLIANCE';