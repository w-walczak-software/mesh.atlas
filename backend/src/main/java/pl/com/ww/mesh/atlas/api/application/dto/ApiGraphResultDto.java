package pl.com.ww.mesh.atlas.api.application.dto;

import java.util.List;

public record ApiGraphResultDto(
        List<ApiGraphSystemDto> systems,
        List<ApiGraphEdgeDto> apis
) {}
