-- safe_convert_from: wraps convert_from and returns NULL instead of raising
-- an exception when the byte sequence is not valid in the target encoding.
-- Required for attachment content search on databases that store binary files
-- (images, PDFs) alongside text-based contracts (JSON, YAML, XML, etc.).
CREATE OR REPLACE FUNCTION atlas.safe_convert_from(data bytea, encoding text)
    RETURNS text
    LANGUAGE plpgsql
    IMMUTABLE
    PARALLEL SAFE
AS
$$
BEGIN
    RETURN convert_from(data, encoding);
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$;
