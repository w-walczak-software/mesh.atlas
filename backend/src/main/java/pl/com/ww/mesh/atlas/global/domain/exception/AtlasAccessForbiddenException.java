package pl.com.ww.mesh.atlas.global.domain.exception;

import org.springframework.http.HttpStatus;

public class AtlasAccessForbiddenException extends AtlasException {

    private static final String KEY = "access.forbidden";

    public AtlasAccessForbiddenException(String context) {
        super("Access denied: " + context, KEY, context, HttpStatus.FORBIDDEN);
    }
}
