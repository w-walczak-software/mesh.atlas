package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class IntegrationNoPendingReviewException extends AtlasException {

    public IntegrationNoPendingReviewException(UUID pipelineId) {
        super("No sync registry in PENDING_REVIEW state for pipeline: " + pipelineId,
                "NO_PENDING_REVIEW", pipelineId.toString(), HttpStatus.CONFLICT);
    }
}
