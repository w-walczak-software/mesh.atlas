-- Integration source field: marks which integration pipeline populated a business record.
-- Non-editable from GUI — set exclusively by the integration sync engine.

ALTER TABLE atlas.it_system    ADD COLUMN IF NOT EXISTS source VARCHAR(255);
ALTER TABLE atlas.api          ADD COLUMN IF NOT EXISTS source VARCHAR(255);
ALTER TABLE atlas.data_domain  ADD COLUMN IF NOT EXISTS source VARCHAR(255);

ALTER TABLE aud.it_system_aud    ADD COLUMN IF NOT EXISTS source VARCHAR(255);
ALTER TABLE aud.api_aud          ADD COLUMN IF NOT EXISTS source VARCHAR(255);
ALTER TABLE aud.data_domain_aud  ADD COLUMN IF NOT EXISTS source VARCHAR(255);
