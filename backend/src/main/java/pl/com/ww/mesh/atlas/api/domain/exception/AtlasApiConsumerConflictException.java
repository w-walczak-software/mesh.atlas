package pl.com.ww.mesh.atlas.api.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasApiConsumerConflictException extends AtlasException {

    private static final String MSG = "Producer system cannot also be listed as a consumer system";
    private static final String KEY = "api.consumer.conflict";

    public AtlasApiConsumerConflictException() {
        super(MSG, KEY, null, HttpStatus.BAD_REQUEST);
    }
}
