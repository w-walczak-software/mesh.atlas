package pl.com.ww.mesh.atlas.global.audit;

public record RevisionEntryDto<T>(
        long revisionNumber,
        RevisionTypeDto revisionType,
        String revisionTimestamp,
        String username,
        String userId,
        T snapshot
) {}
