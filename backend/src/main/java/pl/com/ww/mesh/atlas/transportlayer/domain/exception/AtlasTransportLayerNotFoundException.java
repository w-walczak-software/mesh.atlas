package pl.com.ww.mesh.atlas.transportlayer.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasTransportLayerNotFoundException extends AtlasException {

    private static final String MSG = "Transport layer not found [%s]";
    private static final String KEY = "transportlayer.not.found";

    public AtlasTransportLayerNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
