-- API Subscription: stores both internal (Keycloak) and external (dev portal) subscribers
CREATE TABLE atlas.api_subscription (
    id                   UUID         NOT NULL DEFAULT gen_random_uuid(),
    api_id               UUID         NOT NULL,
    subscriber_type      VARCHAR(20)  NOT NULL,   -- INTERNAL | EXTERNAL
    subscriber_user_id   VARCHAR(255),             -- Keycloak user UUID (INTERNAL only)
    subscriber_email     VARCHAR(255) NOT NULL,
    subscriber_name      VARCHAR(255),
    status               VARCHAR(30)  NOT NULL,   -- ACTIVE | INACTIVE | PENDING_CONFIRMATION
    source               VARCHAR(30)  NOT NULL,   -- INTERNAL_PORTAL | DEVELOPER_PORTAL
    notifications_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    subscribed_at        TIMESTAMP    NOT NULL,   -- analytics: creation date
    confirmed_at         TIMESTAMP,               -- external: email confirmation timestamp
    confirmation_token   VARCHAR(255),             -- external: UUID for confirmation / unsubscribe link
    version              BIGINT       NOT NULL DEFAULT 0,
    created_at           TIMESTAMP,
    created_by           VARCHAR(100),
    updated_at           TIMESTAMP,
    updated_by           VARCHAR(100),
    CONSTRAINT pk_api_subscription PRIMARY KEY (id),
    CONSTRAINT fk_api_subscription_api FOREIGN KEY (api_id) REFERENCES atlas.api(id)
);

-- Lookup indexes
CREATE INDEX idx_api_subscription_api_id       ON atlas.api_subscription(api_id);
CREATE INDEX idx_api_subscription_user_id      ON atlas.api_subscription(subscriber_user_id);
CREATE INDEX idx_api_subscription_email        ON atlas.api_subscription(subscriber_email);
CREATE INDEX idx_api_subscription_status       ON atlas.api_subscription(status);
CREATE INDEX idx_api_subscription_subscribed_at ON atlas.api_subscription(subscribed_at);
CREATE INDEX idx_api_subscription_token        ON atlas.api_subscription(confirmation_token) WHERE confirmation_token IS NOT NULL;

-- Prevent duplicate active INTERNAL subscriptions for the same user+API
CREATE UNIQUE INDEX uq_api_subscription_internal
    ON atlas.api_subscription(api_id, subscriber_user_id)
    WHERE subscriber_type = 'INTERNAL' AND status <> 'INACTIVE';

-- Prevent duplicate active EXTERNAL subscriptions for the same email+API
CREATE UNIQUE INDEX uq_api_subscription_external
    ON atlas.api_subscription(api_id, subscriber_email)
    WHERE subscriber_type = 'EXTERNAL' AND status = 'ACTIVE';
