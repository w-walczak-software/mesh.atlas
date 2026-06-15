package pl.com.ww.mesh.atlas.integration.application.dto;

import java.util.UUID;

public record SyncTriggerDto(UUID syncRegistryId, String message) {}
