-- Remove API_STYLE dictionary (physical delete)
DELETE FROM atlas.dictionary_entry
WHERE dictionary_type_id = (SELECT id FROM atlas.dictionary_type WHERE code = 'API_STYLE');

DELETE FROM atlas.dictionary_type WHERE code = 'API_STYLE';
