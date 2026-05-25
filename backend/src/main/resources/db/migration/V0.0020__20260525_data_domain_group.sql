-- ============================================================================
-- V0.0020__20260525_data_domain_group.sql
-- Data Domain Groups - Dictionary Type, Seed Entries, and FK Column
-- ============================================================================

-- ============================================================================
-- DICTIONARY TYPE
-- ============================================================================

INSERT INTO dictionary_type (
    id,
    code,
    name,
    description,
    system_defined,
    active,
    created_at,
    created_by
)
VALUES (
    gen_random_uuid(),
    'DATA_DOMAIN_GROUP',
    'Data Domain Group',
    'High-level grouping category for data domains',
    TRUE,
    TRUE,
    now(),
    'system'
);

-- ============================================================================
-- SEED ENTRIES
-- ============================================================================

INSERT INTO dictionary_entry (
    id,
    dictionary_type_id,
    code,
    name,
    description,
    display_order,
    active,
    system_defined,
    created_at,
    created_by
)
SELECT
    gen_random_uuid(),
    dt.id,
    v.code,
    v.name,
    v.description,
    v.display_order,
    TRUE,
    TRUE,
    now(),
    'system'
FROM dictionary_type dt
         CROSS JOIN (
    VALUES
        ('FINANCE',         'Finance',          'Financial data: transactions, budgets, accounting',      1),
        ('CUSTOMER',        'Customer',         'Customer and client data: profiles, contacts, CRM',      2),
        ('PRODUCT',         'Product',          'Product catalogue, inventory, pricing',                  3),
        ('OPERATIONS',      'Operations',       'Operational data: logistics, supply chain, fulfilment',  4),
        ('HR',              'HR',               'Human resources: employees, org structure, payroll',     5),
        ('MARKETING',       'Marketing',        'Marketing and campaign data, audiences, analytics',      6),
        ('COMPLIANCE',      'Compliance',       'Regulatory and compliance data, audit logs, GDPR',       7),
        ('TECHNICAL',       'Technical',        'Technical metadata, infrastructure, platform data',      8),
        ('SECURITY',        'Security',         'Security events, access logs, identity data',            9),
        ('OTHER',           'Other',            'Uncategorised or cross-domain data',                     10)
) AS v(code, name, description, display_order)
WHERE dt.code = 'DATA_DOMAIN_GROUP';

-- ============================================================================
-- ADD group_id COLUMN TO data_domain
-- ============================================================================

ALTER TABLE atlas.data_domain
    ADD COLUMN group_id UUID REFERENCES atlas.dictionary_entry(id);

CREATE INDEX idx_data_domain_group_id ON atlas.data_domain (group_id);

-- ============================================================================
-- ADD group_id TO AUDIT TABLE
-- ============================================================================

ALTER TABLE aud.data_domain_aud
    ADD COLUMN group_id UUID;
