-- Set meaningful governance defaults for key roles.
-- SYSTEM_OWNER_ROLE: BUSINESS_OWNER and TECHNICAL_OWNER can verify new APIs;
--                    TECHNICAL_OWNER can additionally define new APIs.
-- API_OWNER_ROLE:    OWNER and TECHNICAL_LEAD can edit the API.

UPDATE atlas.dictionary_entry de
SET metadata = '{"canDefineApi": false, "canVerifyApi": true}'::jsonb
FROM atlas.dictionary_type dt
WHERE de.dictionary_type_id = dt.id
  AND dt.code = 'SYSTEM_OWNER_ROLE'
  AND de.code = 'BUSINESS_OWNER';

UPDATE atlas.dictionary_entry de
SET metadata = '{"canDefineApi": true, "canVerifyApi": true}'::jsonb
FROM atlas.dictionary_type dt
WHERE de.dictionary_type_id = dt.id
  AND dt.code = 'SYSTEM_OWNER_ROLE'
  AND de.code = 'TECHNICAL_OWNER';

UPDATE atlas.dictionary_entry de
SET metadata = '{"canEditApi": true}'::jsonb
FROM atlas.dictionary_type dt
WHERE de.dictionary_type_id = dt.id
  AND dt.code = 'API_OWNER_ROLE'
  AND de.code IN ('OWNER', 'TECHNICAL_LEAD');
