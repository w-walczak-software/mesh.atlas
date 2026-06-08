package pl.com.ww.mesh.atlas.api.domain.model;

public enum SubscriptionStatus {
    /** Subscription is active — subscriber receives change notifications. */
    ACTIVE,
    /** Subscription has been deactivated by user or admin. */
    INACTIVE,
    /** External subscription awaiting email confirmation. */
    PENDING_CONFIRMATION
}
