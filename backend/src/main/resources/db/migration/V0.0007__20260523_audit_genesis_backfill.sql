-- ── Genesis audit backfill ────────────────────────────────────────────────────
-- Populates dictionary audit tables with the initial state of all dictionary
-- data that was seeded before Hibernate Envers was enabled (V0.0006).
-- Without this, loading IT System revision history throws ObjectNotFoundException
-- because the NOT_AUDITED relation query (max rev <= current) finds no rows.
--
-- revtype: 0=ADD, 1=MOD, 2=DEL

INSERT INTO revinfo (rev, rev_tstmp, username, user_id)
VALUES (0, (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT, 'system', null);

INSERT INTO dictionary_type_aud (id, rev, revtype, version, created_at, created_by, updated_at, updated_by,
                                  code, name, description, system_defined, active)
SELECT id, 0, 0, version, created_at, created_by, updated_at, updated_by,
       code, name, description, system_defined, active
FROM dictionary_type;

INSERT INTO dictionary_entry_aud (id, rev, revtype, version, created_at, created_by, updated_at, updated_by,
                                   dictionary_type_id, code, name, description,
                                   display_order, active, system_defined, metadata)
SELECT id, 0, 0, version, created_at, created_by, updated_at, updated_by,
       dictionary_type_id, code, name, description,
       display_order, active, system_defined, metadata
FROM dictionary_entry;
