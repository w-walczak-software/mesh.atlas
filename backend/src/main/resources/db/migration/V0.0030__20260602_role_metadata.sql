-- Role metadata defaults: extend SYSTEM_OWNER_ROLE and API_OWNER_ROLE entries
-- with typed boolean capabilities stored in the JSONB metadata column.
-- All existing entries default to false; admins configure actual permissions via UI.

-- SYSTEM_OWNER_ROLE: canDefineApi, canVerifyApi
UPDATE atlas.dictionary_entry de
SET metadata = '{"canDefineApi": false, "canVerifyApi": false}'::jsonb
FROM atlas.dictionary_type dt
WHERE de.dictionary_type_id = dt.id
  AND dt.code = 'SYSTEM_OWNER_ROLE'
  AND de.metadata IS NULL;

-- API_OWNER_ROLE: canEditApi
UPDATE atlas.dictionary_entry de
SET metadata = '{"canEditApi": false}'::jsonb
FROM atlas.dictionary_type dt
WHERE de.dictionary_type_id = dt.id
  AND dt.code = 'API_OWNER_ROLE'
  AND de.metadata IS NULL;
