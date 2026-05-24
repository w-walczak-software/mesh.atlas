package pl.com.ww.mesh.atlas.datadomain.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDataDomainDuplicateCodeException extends AtlasException {

    private static final String MSG = "Data Domain with code [%s] already exists";
    private static final String KEY = "datadomain.duplicate.code";

    public AtlasDataDomainDuplicateCodeException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.CONFLICT);
    }

    public AtlasDataDomainDuplicateCodeException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.CONFLICT);
    }
}
