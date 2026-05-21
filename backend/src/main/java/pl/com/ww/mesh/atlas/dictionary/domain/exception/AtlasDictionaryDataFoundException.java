package pl.com.ww.mesh.atlas.dictionary.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDictionaryDataFoundException extends AtlasException {

    private static final String MSG = "Dictionary entry found [%s]";
    private static final String KEY = "dict.entryFound";

    public AtlasDictionaryDataFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.BAD_REQUEST);
    }

    public AtlasDictionaryDataFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.BAD_REQUEST);
    }
}
