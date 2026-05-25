package pl.com.ww.mesh.atlas.transportlayer.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasTransportLayerDuplicateCodeException extends AtlasException {

    private static final String MSG = "Transport layer with code [%s] already exists";
    private static final String KEY = "transportlayer.duplicate.code";

    public AtlasTransportLayerDuplicateCodeException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.CONFLICT);
    }
}
