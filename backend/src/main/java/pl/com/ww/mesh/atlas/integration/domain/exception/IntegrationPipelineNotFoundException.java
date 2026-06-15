package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class IntegrationPipelineNotFoundException extends AtlasException {

    public IntegrationPipelineNotFoundException(UUID id) {
        super("Integration pipeline not found: " + id, "NOT_FOUND", id.toString(), HttpStatus.NOT_FOUND);
    }
}
