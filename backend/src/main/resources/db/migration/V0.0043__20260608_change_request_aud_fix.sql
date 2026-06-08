-- Fix: add missing columns to change_request_aud that Hibernate Envers requires
ALTER TABLE aud.change_request_aud
    ADD COLUMN change_type_id UUID,
    ADD COLUMN priority_id    UUID,
    ADD COLUMN description    TEXT;
