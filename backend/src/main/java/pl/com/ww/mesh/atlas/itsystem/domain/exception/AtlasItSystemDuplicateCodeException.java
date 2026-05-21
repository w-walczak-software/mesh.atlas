package pl.com.ww.mesh.atlas.itsystem.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasItSystemDuplicateCodeException extends AtlasException {

    private static final String MSG = "IT System with code [%s] already exists";
    private static final String KEY = "itsystem.duplicate.code";

    public AtlasItSystemDuplicateCodeException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.CONFLICT);
    }

    public AtlasItSystemDuplicateCodeException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.CONFLICT);
    }
}
