package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiDuplicateCodeException extends AtlasException {

    private static final String MSG = "API with code [%s] already exists";
    private static final String KEY = "api.duplicate.code";

    public AtlasApiDuplicateCodeException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.CONFLICT);
    }

    public AtlasApiDuplicateCodeException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.CONFLICT);
    }
}
