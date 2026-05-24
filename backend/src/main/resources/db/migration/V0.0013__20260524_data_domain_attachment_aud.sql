CREATE TABLE aud.data_domain_attachment_aud
(
    id             UUID         NOT NULL,
    rev            BIGINT       NOT NULL,
    revtype        SMALLINT     NOT NULL,
    data_domain_id UUID,
    file_name      VARCHAR(500),
    content_type   VARCHAR(200),
    file_size      BIGINT,
    description    TEXT,
    created_at     TIMESTAMP,
    created_by     VARCHAR(100),

    CONSTRAINT pk_data_domain_attachment_aud PRIMARY KEY (id, rev),
    CONSTRAINT fk_data_domain_attachment_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_data_domain_attachment_aud_rev    ON aud.data_domain_attachment_aud (rev);
CREATE INDEX idx_data_domain_attachment_aud_domain ON aud.data_domain_attachment_aud (data_domain_id);
