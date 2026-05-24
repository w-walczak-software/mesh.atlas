-- Add icon field to IT System
ALTER TABLE atlas.it_system
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

-- Add icon field to audit table
ALTER TABLE aud.it_system_aud
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
