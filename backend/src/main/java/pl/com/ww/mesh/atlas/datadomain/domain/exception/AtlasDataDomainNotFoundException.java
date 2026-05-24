package pl.com.ww.mesh.atlas.datadomain.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDataDomainNotFoundException extends AtlasException {

    private static final String MSG = "Data Domain not found [%s]";
    private static final String KEY = "datadomain.not.found";

    public AtlasDataDomainNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasDataDomainNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
