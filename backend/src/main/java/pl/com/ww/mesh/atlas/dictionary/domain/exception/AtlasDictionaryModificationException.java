package pl.com.ww.mesh.atlas.dictionary.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDictionaryModificationException extends AtlasException {

    private static final String MSG = "Dictionary entry modification not allowed [%s]";
    private static final String KEY = "dict.entryModNotAllowed";

    public AtlasDictionaryModificationException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.BAD_REQUEST);
    }

    public AtlasDictionaryModificationException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.BAD_REQUEST);
    }
}
