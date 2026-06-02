package pl.com.ww.mesh.atlas.email.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class EmailSendException extends AtlasException {

    public EmailSendException(String detail, Exception cause) {
        super("Failed to send email: " + detail, "email.send.failed", detail, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }

    public EmailSendException(String detail) {
        super(detail, "email.disabled", detail, HttpStatus.BAD_REQUEST);
    }
}
