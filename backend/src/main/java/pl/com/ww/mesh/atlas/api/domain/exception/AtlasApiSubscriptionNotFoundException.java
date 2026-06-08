package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiSubscriptionNotFoundException extends AtlasException {

    private static final String MSG = "API subscription not found [%s]";
    private static final String KEY = "api.subscription.not.found";

    public AtlasApiSubscriptionNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
