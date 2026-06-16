package pl.com.ww.mesh.atlas.integration.application.dto;

import java.util.List;
import java.util.UUID;

public record StagingBulkActionRequest(List<UUID> ids) {}
