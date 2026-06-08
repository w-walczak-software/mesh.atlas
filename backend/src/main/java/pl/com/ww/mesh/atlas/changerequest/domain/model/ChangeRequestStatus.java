package pl.com.ww.mesh.atlas.changerequest.domain.model;

public enum ChangeRequestStatus {
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    DEFERRED,
    IMPLEMENTED,
    CANCELLED;

    public boolean isTerminal() {
        return this == IMPLEMENTED || this == CANCELLED || this == REJECTED;
    }

    public boolean allowsReview() {
        return this == SUBMITTED || this == UNDER_REVIEW;
    }
}
