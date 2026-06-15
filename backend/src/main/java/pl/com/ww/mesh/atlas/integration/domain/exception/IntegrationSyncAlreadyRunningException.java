package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class IntegrationSyncAlreadyRunningException extends AtlasException {

    public IntegrationSyncAlreadyRunningException(UUID pipelineId) {
        super("Sync already running for pipeline: " + pipelineId, "SYNC_ALREADY_RUNNING",
                pipelineId.toString(), HttpStatus.CONFLICT);
    }
}
