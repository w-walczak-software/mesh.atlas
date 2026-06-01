package pl.com.ww.mesh.atlas.administration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class AtlasAdminUserNotFoundException extends AtlasException {

    private static final String MSG = "User not found [%s]";
    private static final String KEY = "admin.user.notFound";

    public AtlasAdminUserNotFoundException(String userId) {
        super(String.format(MSG, userId), KEY, userId, HttpStatus.NOT_FOUND);
    }
}
