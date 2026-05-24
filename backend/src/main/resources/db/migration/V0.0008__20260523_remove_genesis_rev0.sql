-- Remove genesis audit rows inserted at rev=0 in V0.0007.
-- Envers validates revision > 0 (checkPositive), so rev=0 rows cause
-- "Entity revision has to be greater than 0" when any NOT_AUDITED relation
-- proxy is initialized at that revision.
-- Related entity references are now resolved from live tables at query time.

DELETE FROM dictionary_entry_aud WHERE rev = 0;
DELETE FROM dictionary_type_aud  WHERE rev = 0;
DELETE FROM revinfo              WHERE rev = 0;
