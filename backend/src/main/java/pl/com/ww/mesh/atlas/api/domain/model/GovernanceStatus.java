package pl.com.ww.mesh.atlas.api.domain.model;

public enum GovernanceStatus {
    /** Newly created API awaiting first verification. Hidden from general listing. */
    PENDING_VERIFICATION,
    /** Approved and published. Visible to all. */
    VERIFIED,
    /** Rejected after first review. Creator must fix and resubmit. Hidden from general listing. */
    REQUIRES_MODIFICATION,
    /** Already verified API with pending changes awaiting review. Visible to all. */
    PENDING_REVIEW
}
