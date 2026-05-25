package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiNotFoundException extends AtlasException {

    private static final String MSG = "API not found [%s]";
    private static final String KEY = "api.not.found";

    public AtlasApiNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasApiNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
