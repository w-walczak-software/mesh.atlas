package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class IntegrationDatasourceNotFoundException extends AtlasException {

    public IntegrationDatasourceNotFoundException(UUID id) {
        super("Integration datasource not found: " + id, "NOT_FOUND", id.toString(), HttpStatus.NOT_FOUND);
    }
}
