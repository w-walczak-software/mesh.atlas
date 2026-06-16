package pl.com.ww.mesh.atlas.integration.domain.exception;

import org.springframework.http.HttpStatus;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import java.util.UUID;

public class IntegrationSyncNotAbandonableException extends AtlasException {

    public IntegrationSyncNotAbandonableException(UUID id) {
        super("Sync registry cannot be abandoned (not in PENDING_REVIEW state): " + id,
                "NOT_ABANDONABLE", id.toString(), HttpStatus.CONFLICT);
    }
}
