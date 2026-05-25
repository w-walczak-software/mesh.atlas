package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiOwnerNotFoundException extends AtlasException {

    private static final String MSG = "API owner not found [%s]";
    private static final String KEY = "api.owner.not.found";

    public AtlasApiOwnerNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasApiOwnerNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
