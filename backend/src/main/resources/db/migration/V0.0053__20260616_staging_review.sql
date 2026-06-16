-- Staging review: manual promotion mode controlled by SYNC_AUTO_PROMOTE system parameter.
-- When SYNC_AUTO_PROMOTE = false, staging rows stay PENDING until the user accepts or rejects them,
-- and only accepted rows are promoted to business entities via an explicit "Transfer Data" action.

-- ─── System parameter: SYNC_AUTO_PROMOTE ─────────────────────────────────────

INSERT INTO atlas.system_parameter (parameter_key, parameter_name, parameter_type, description, category,
                                    boolean_value, system_defined, created_by)
VALUES ('SYNC_AUTO_PROMOTE',
        'Sync – automatyczna promocja stagingu',
        'BOOLEAN',
        'Określa, czy dane ze stagingu są automatycznie przenoszone do tabel biznesowych po synchronizacji. '
            || 'Gdy false, wymagana jest ręczna akceptacja lub odrzucenie każdego rekordu przed promocją.',
        'INTEGRATION',
        true,
        true,
        'system');

-- ─── Extend staging_status CHECK constraints ─────────────────────────────────
-- PostgreSQL does not support ALTER CONSTRAINT; drop and recreate.

ALTER TABLE atlas.staging_it_system
    DROP CONSTRAINT chk_staging_its_status;
ALTER TABLE atlas.staging_it_system
    ADD CONSTRAINT chk_staging_its_status
        CHECK (staging_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SYNCED', 'ERROR', 'SKIPPED'));

ALTER TABLE atlas.staging_api
    DROP CONSTRAINT chk_staging_api_status;
ALTER TABLE atlas.staging_api
    ADD CONSTRAINT chk_staging_api_status
        CHECK (staging_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SYNCED', 'ERROR', 'SKIPPED'));

ALTER TABLE atlas.staging_data_domain
    DROP CONSTRAINT chk_staging_dd_status;
ALTER TABLE atlas.staging_data_domain
    ADD CONSTRAINT chk_staging_dd_status
        CHECK (staging_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SYNCED', 'ERROR', 'SKIPPED'));

-- ─── Extend sync_registry.status CHECK constraint ────────────────────────────

ALTER TABLE atlas.sync_registry
    DROP CONSTRAINT chk_sync_registry_status;
ALTER TABLE atlas.sync_registry
    ADD CONSTRAINT chk_sync_registry_status
        CHECK (status IN ('PENDING', 'RUNNING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED', 'PARTIAL'));
