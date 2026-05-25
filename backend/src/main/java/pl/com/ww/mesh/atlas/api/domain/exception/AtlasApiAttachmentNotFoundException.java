package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiAttachmentNotFoundException extends AtlasException {

    private static final String MSG = "API attachment not found [%s]";
    private static final String KEY = "api.attachment.not.found";

    public AtlasApiAttachmentNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }

    public AtlasApiAttachmentNotFoundException() {
        super(String.format(MSG, ""), KEY, null, HttpStatus.NOT_FOUND);
    }
}
