-- API Ratings
-- One rating per rater per API, unique by (api_id, rater_id, rater_type).
-- rater_type distinguishes INTERNAL_USER (mesh.atlas users) from DEVELOPER_PORTAL
-- (future portal users) so both can co-exist without collision.

CREATE TABLE atlas.api_rating
(
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    api_id      UUID         NOT NULL,
    rater_id    VARCHAR(255) NOT NULL,
    rater_type  VARCHAR(30)  NOT NULL DEFAULT 'INTERNAL_USER',
    score       SMALLINT     NOT NULL CHECK (score BETWEEN 1 AND 5),
    version     BIGINT       NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL,
    created_by  VARCHAR(100) NOT NULL,
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),

    CONSTRAINT uq_api_rating_rater UNIQUE (api_id, rater_id, rater_type),
    CONSTRAINT fk_api_rating_api   FOREIGN KEY (api_id) REFERENCES atlas.api (id)
);

CREATE INDEX idx_api_rating_api_id ON atlas.api_rating (api_id);
CREATE INDEX idx_api_rating_rater  ON atlas.api_rating (rater_id, rater_type);

-- Envers audit
CREATE TABLE aud.api_rating_aud
(
    id         UUID         NOT NULL,
    rev        INTEGER      NOT NULL,
    revtype    SMALLINT     NOT NULL,
    api_id     UUID,
    rater_id   VARCHAR(255),
    rater_type VARCHAR(30),
    score      SMALLINT,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_api_rating_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);
