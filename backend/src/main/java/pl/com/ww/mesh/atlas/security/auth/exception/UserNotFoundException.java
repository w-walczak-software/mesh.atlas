package pl.com.ww.mesh.atlas.security.auth.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class UserNotFoundException extends AtlasException {
    private static final String MSG = "User not found [%s]";
    private static final String KEY = "user.not.found";

    public UserNotFoundException(String context) {
        super(String.format(MSG, context), KEY, context, HttpStatus.UNAUTHORIZED);
    }

}
