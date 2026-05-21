package pl.com.ww.mesh.atlas.itsystem.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasItSystemNotFoundException extends AtlasException {

    private static final String MSG = "IT System not found [%s]";
    private static final String KEY = "itsystem.not.found";

    public AtlasItSystemNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasItSystemNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
