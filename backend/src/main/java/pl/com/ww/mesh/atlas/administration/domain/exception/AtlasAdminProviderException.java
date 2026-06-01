package pl.com.ww.mesh.atlas.administration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasAdminProviderException extends AtlasException {

    private static final String KEY = "admin.provider.error";

    public AtlasAdminProviderException(String message) {
        super(message, KEY, null, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public AtlasAdminProviderException(String message, Exception cause) {
        super(message, KEY, null, HttpStatus.INTERNAL_SERVER_ERROR, cause);
    }
}
