-- Move all Envers audit tables to a dedicated 'aud' schema for separation of concerns.
-- revinfo is moved first because the other tables hold FK references to it.

CREATE SCHEMA IF NOT EXISTS aud;

ALTER TABLE revinfo             SET SCHEMA aud;

ALTER TABLE it_system_aud        SET SCHEMA aud;
ALTER TABLE it_system_owner_aud  SET SCHEMA aud;
ALTER TABLE dictionary_type_aud  SET SCHEMA aud;
ALTER TABLE dictionary_entry_aud SET SCHEMA aud;
