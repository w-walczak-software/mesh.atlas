package pl.com.ww.mesh.atlas.global.domain.exception;

import org.springframework.http.HttpStatus;

public class AtlasGovernanceViolationException extends AtlasException {

    private static final String KEY = "governance.owner.required";

    public AtlasGovernanceViolationException(String context) {
        super("Governance policy violation: " + context, KEY, context, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
