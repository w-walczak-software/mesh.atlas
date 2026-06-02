package pl.com.ww.mesh.atlas.audit.domain.model;

public enum AuditAction {

    // General data lifecycle
    CREATE,
    UPDATE,
    DELETE,
    DEACTIVATE,
    ACTIVATE,

    // Attachment management
    ATTACHMENT_UPLOADED,
    ATTACHMENT_UPDATED,
    ATTACHMENT_DELETED,
    ATTACHMENT_DOWNLOADED,

    // User & role management
    USER_ROLE_ASSIGNED,
    USER_ROLE_REVOKED,

    // Data access
    EXPORT,
    IMPORT,

    // Security events
    LOGIN,
    LOGOUT,

    // Governance workflow
    APPROVAL_REQUESTED,
    APPROVED,
    REJECTED,

    // Platform administration
    CONFIGURATION_CHANGED,

    // Email
    EMAIL_SENT
}
