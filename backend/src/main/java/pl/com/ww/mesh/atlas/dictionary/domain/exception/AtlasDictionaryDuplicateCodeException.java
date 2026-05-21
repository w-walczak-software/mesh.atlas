package pl.com.ww.mesh.atlas.dictionary.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDictionaryDuplicateCodeException extends AtlasException {

    private static final String MSG = "Dictionary entry duplicate [%s]";
    private static final String KEY = "dict.entryDuplicate";

    public AtlasDictionaryDuplicateCodeException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.CONFLICT);
    }

    public AtlasDictionaryDuplicateCodeException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.CONFLICT);
    }
}
