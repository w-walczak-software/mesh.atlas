package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiMessagingEndpointNotFoundException extends AtlasException {

    private static final String MSG = "API messaging endpoint not found [%s]";
    private static final String KEY = "api.messaging.endpoint.not.found";

    public AtlasApiMessagingEndpointNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
