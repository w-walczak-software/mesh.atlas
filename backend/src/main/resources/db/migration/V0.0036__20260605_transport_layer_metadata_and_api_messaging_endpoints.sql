-- ─── 1. Transport layer: add metadata JSONB ─────────────────────────────────

ALTER TABLE atlas.transport_layer ADD COLUMN metadata JSONB DEFAULT NULL;
ALTER TABLE aud.transport_layer_aud ADD COLUMN metadata JSONB DEFAULT NULL;

-- Seed: Kafka — register topics
UPDATE atlas.transport_layer
SET metadata = '{"supportsEndpointRegistration": true, "endpointLabel": "Kafka Topic", "endpointLabelPl": "Temat Kafka"}'
WHERE code = 'KAFKA';

-- Seed: AMQP-based brokers — register queues/topics
UPDATE atlas.transport_layer
SET metadata = '{"supportsEndpointRegistration": true, "endpointLabel": "Queue / Topic", "endpointLabelPl": "Kolejka / Temat"}'
WHERE code IN ('RABBITMQ', 'IBM_MQ', 'ACTIVEMQ', 'AZURE_SB');

-- ─── 2. New dictionary types ─────────────────────────────────────────────────

INSERT INTO atlas.dictionary_type (code, name, description, system_defined, active, created_at, created_by) VALUES
('MESSAGING_ENDPOINT_TYPE', 'Messaging Endpoint Type', 'Type of messaging endpoint (topic, queue, exchange)', true, true, now(), 'system'),
('MESSAGING_DIRECTION',     'Messaging Direction',     'Direction of message flow for a messaging endpoint', true, true, now(), 'system');

-- MESSAGING_ENDPOINT_TYPE entries
INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'TOPIC',    'Topic',    'Pub/sub messaging topic',          1, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_ENDPOINT_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'QUEUE',    'Queue',    'Point-to-point message queue',     2, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_ENDPOINT_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'EXCHANGE', 'Exchange', 'AMQP exchange (message routing)',  3, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_ENDPOINT_TYPE';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'CHANNEL',  'Channel',  'Generic messaging channel',        4, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_ENDPOINT_TYPE';

-- MESSAGING_DIRECTION entries
INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'PRODUCER',          'Producer',            'API publishes messages to this endpoint',          1, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_DIRECTION';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'CONSUMER',          'Consumer',            'API consumes messages from this endpoint',         2, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_DIRECTION';

INSERT INTO atlas.dictionary_entry (dictionary_type_id, code, name, description, display_order, active, system_defined, created_at, created_by)
SELECT dt.id, 'PRODUCER_CONSUMER', 'Producer & Consumer', 'API both publishes and consumes on this endpoint', 3, true, true, now(), 'system' FROM atlas.dictionary_type dt WHERE dt.code = 'MESSAGING_DIRECTION';

-- ─── 3. API messaging endpoints table ───────────────────────────────────────

CREATE TABLE atlas.api_messaging_endpoint (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    api_id              UUID        NOT NULL,
    name                VARCHAR(300) NOT NULL,
    endpoint_type_id    UUID,
    direction_id        UUID,
    message_format_id   UUID,
    description         TEXT,
    display_order       INT         NOT NULL DEFAULT 0,
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    version             BIGINT      NOT NULL DEFAULT 0,
    created_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_at          TIMESTAMP,
    updated_by          VARCHAR(255),

    CONSTRAINT pk_api_messaging_endpoint    PRIMARY KEY (id),
    CONSTRAINT fk_ame_api                   FOREIGN KEY (api_id)            REFERENCES atlas.api(id),
    CONSTRAINT fk_ame_endpoint_type         FOREIGN KEY (endpoint_type_id)  REFERENCES atlas.dictionary_entry(id),
    CONSTRAINT fk_ame_direction             FOREIGN KEY (direction_id)      REFERENCES atlas.dictionary_entry(id),
    CONSTRAINT fk_ame_message_format        FOREIGN KEY (message_format_id) REFERENCES atlas.dictionary_entry(id)
);

CREATE INDEX idx_ame_api_id ON atlas.api_messaging_endpoint (api_id);
CREATE INDEX idx_ame_active  ON atlas.api_messaging_endpoint (active);

-- Audit table (Hibernate Envers)
CREATE TABLE aud.api_messaging_endpoint_aud (
    id                  UUID        NOT NULL,
    rev                 BIGINT      NOT NULL,
    revtype             SMALLINT,
    api_id              UUID,
    name                VARCHAR(300),
    endpoint_type_id    UUID,
    direction_id        UUID,
    message_format_id   UUID,
    description         TEXT,
    display_order       INT,
    active              BOOLEAN,
    created_at          TIMESTAMP,
    created_by          VARCHAR(255),
    updated_at          TIMESTAMP,
    updated_by          VARCHAR(255),

    CONSTRAINT pk_api_messaging_endpoint_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_ame_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo(rev)
);

CREATE INDEX idx_ame_aud_rev ON aud.api_messaging_endpoint_aud (rev);
