package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiSubscriptionDuplicateException extends AtlasException {

    private static final String MSG = "Active subscription already exists for this API and subscriber";
    private static final String KEY = "api.subscription.duplicate";

    public AtlasApiSubscriptionDuplicateException() {
        super(MSG, KEY, null, HttpStatus.CONFLICT);
    }
}
