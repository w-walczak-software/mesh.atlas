-- External ID field for IT System and API – used to store identifiers from external source systems (e.g. CMDB)

ALTER TABLE atlas.it_system ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);
ALTER TABLE aud.it_system_aud ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);

ALTER TABLE atlas.api ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);
ALTER TABLE aud.api_aud ADD COLUMN IF NOT EXISTS external_id VARCHAR(50);
