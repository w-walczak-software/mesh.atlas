package pl.com.ww.mesh.atlas.datadomain.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasDataDomainAttachmentNotFoundException extends AtlasException {

    private static final String MSG = "Data Domain Attachment not found [%s]";
    private static final String KEY = "datadomain.attachment.not.found";

    public AtlasDataDomainAttachmentNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
