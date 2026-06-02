package pl.com.ww.mesh.atlas.systemparameter.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class SystemParameterNotFoundException extends AtlasException {

    private static final String MSG = "System parameter not found [%s]";
    private static final String KEY = "systemParam.notFound";

    public SystemParameterNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.NOT_FOUND);
    }
}
