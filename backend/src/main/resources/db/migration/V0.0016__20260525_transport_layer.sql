-- Transport Layer catalog
CREATE TABLE atlas.transport_layer (
    id              UUID            NOT NULL DEFAULT gen_random_uuid(),
    code            VARCHAR(100)    NOT NULL,
    name            VARCHAR(300)    NOT NULL,
    description     TEXT,
    icon            VARCHAR(100),
    it_system_id    UUID,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    version         BIGINT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_at      TIMESTAMP,
    updated_by      VARCHAR(255),
    CONSTRAINT pk_transport_layer PRIMARY KEY (id),
    CONSTRAINT uq_transport_layer_code UNIQUE (code),
    CONSTRAINT fk_transport_layer_it_system
        FOREIGN KEY (it_system_id) REFERENCES atlas.it_system(id) ON DELETE SET NULL
);

CREATE INDEX idx_transport_layer_active   ON atlas.transport_layer (active);
CREATE INDEX idx_transport_layer_it_system ON atlas.transport_layer (it_system_id);

-- Audit table (Hibernate Envers)
CREATE TABLE aud.transport_layer_aud (
    id              UUID        NOT NULL,
    rev             BIGINT      NOT NULL,
    revtype         SMALLINT,
    code            VARCHAR(100),
    name            VARCHAR(300),
    description     TEXT,
    icon            VARCHAR(100),
    it_system_id    UUID,
    active          BOOLEAN,
    created_at      TIMESTAMP,
    created_by      VARCHAR(255),
    updated_at      TIMESTAMP,
    updated_by      VARCHAR(255),
    CONSTRAINT pk_transport_layer_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_tl_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo(rev)
);

CREATE INDEX idx_transport_layer_aud_rev ON aud.transport_layer_aud (rev);

-- ─── Seed data ────────────────────────────────────────────────────────────────
INSERT INTO atlas.transport_layer (code, name, description, icon, active) VALUES
-- HTTP / API
('REST',        'REST',         'Representational State Transfer — HTTP-based synchronous API', 'api',               true),
('SOAP',        'SOAP',         'Simple Object Access Protocol — XML-based messaging over HTTP', 'description',       true),
('GRAPHQL',     'GraphQL',      'Query language and runtime for flexible API requests',          'account_tree',      true),
('GRPC',        'gRPC',         'Google Remote Procedure Call over HTTP/2 with Protobuf',        'speed',             true),
('WEBSOCKET',   'WebSocket',    'Full-duplex persistent connection over TCP',                    'sync',              true),
-- Messaging / Event streaming
('KAFKA',       'Apache Kafka', 'Distributed event streaming platform for high-throughput messaging', 'stream',       true),
('RABBITMQ',    'RabbitMQ',     'Open-source AMQP message broker',                              'swap_horiz',        true),
('IBM_MQ',      'IBM MQ',       'Enterprise messaging middleware (formerly MQSeries)',           'hub',               true),
('ACTIVEMQ',    'ActiveMQ',     'Open-source JMS message broker by Apache',                     'electrical_services', true),
('AZURE_SB',    'Azure Service Bus', 'Cloud messaging service — queues and topics',             'cloud_queue',       true),
-- File transfer
('SFTP',        'SFTP',         'SSH File Transfer Protocol — encrypted file exchange',          'folder_zip',        true),
('FTP',         'FTP',          'File Transfer Protocol — unencrypted file exchange',            'folder',            true),
('S3',          'Amazon S3',    'Object storage via S3-compatible API',                          'cloud_upload',      true),
('NFS',         'NFS',          'Network File System — network-based file sharing',              'storage',           true),
-- Data integration
('ETL',         'ETL',          'Extract, Transform, Load — batch data pipeline pattern',        'transform',         true),
('NIFI',        'Apache NiFi',  'Visual data flow automation and routing platform',              'alt_route',         true),
('JDBC',        'JDBC / ODBC',  'Direct relational database connectivity',                       'table_chart',       true),
('CDC',         'CDC',          'Change Data Capture — streaming database change events',        'compare_arrows',    true),
-- Other
('EMAIL',       'Email / SMTP', 'Electronic mail delivery via SMTP/IMAP',                       'email',             true),
('AS2',         'AS2',          'Applicability Statement 2 — EDI/B2B file exchange',             'swap_calls',        true);
