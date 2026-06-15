package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

public record SyncExecutionResult(boolean success, String log, String errorDetails) {}
