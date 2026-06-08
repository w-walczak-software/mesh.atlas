package pl.com.ww.mesh.atlas.changerequest.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class ChangeRequestNotFoundException extends AtlasException {

    private static final String MSG = "Change Request not found [%s]";
    private static final String KEY = "change.request.not.found";

    public ChangeRequestNotFoundException(UUID id) {
        super(String.format(MSG, id), KEY, id.toString(), HttpStatus.NOT_FOUND);
    }
}
