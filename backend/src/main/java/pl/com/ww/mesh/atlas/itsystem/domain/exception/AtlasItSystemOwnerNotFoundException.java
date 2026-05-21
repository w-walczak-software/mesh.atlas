package pl.com.ww.mesh.atlas.itsystem.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasItSystemOwnerNotFoundException extends AtlasException {

    private static final String MSG = "IT System owner not found [%s]";
    private static final String KEY = "itsystem.owner.not.found";

    public AtlasItSystemOwnerNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
