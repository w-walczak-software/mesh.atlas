package pl.com.ww.mesh.atlas.email.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class EmailTemplateNotFoundException extends AtlasException {

    public EmailTemplateNotFoundException(String identifier) {
        super("Email template not found: " + identifier, "email.template.notFound", identifier, HttpStatus.NOT_FOUND);
    }
}
