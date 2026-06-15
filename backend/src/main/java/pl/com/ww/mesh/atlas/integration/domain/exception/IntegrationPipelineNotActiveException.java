package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

public class IntegrationPipelineNotActiveException extends AtlasException {

    public IntegrationPipelineNotActiveException(String code) {
        super("Pipeline is not ACTIVE: " + code, "PIPELINE_NOT_ACTIVE", code, HttpStatus.BAD_REQUEST);
    }
}
