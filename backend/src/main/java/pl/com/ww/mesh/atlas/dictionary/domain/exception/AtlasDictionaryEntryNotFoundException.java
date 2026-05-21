package pl.com.ww.mesh.atlas.dictionary.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDictionaryEntryNotFoundException extends AtlasException {

    private static final String MSG = "Dictionary entry not found [%s]";
    private static final String KEY = "dict.entryNotFound";

    public AtlasDictionaryEntryNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasDictionaryEntryNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
