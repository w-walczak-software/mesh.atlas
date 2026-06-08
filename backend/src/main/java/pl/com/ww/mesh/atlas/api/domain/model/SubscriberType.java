package pl.com.ww.mesh.atlas.api.domain.model;

public enum SubscriberType {
    /** Authenticated Keycloak user subscribing via the internal portal. */
    INTERNAL,
    /** Anonymous user subscribing via email (future developer portal). */
    EXTERNAL
}
