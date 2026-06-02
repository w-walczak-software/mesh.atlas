package pl.com.ww.mesh.atlas.email.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class EmailConfigNotFoundException extends AtlasException {

    public EmailConfigNotFoundException() {
        super("Email configuration not found", "email.config.notFound", "default", HttpStatus.NOT_FOUND);
    }
}
