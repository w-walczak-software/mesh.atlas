package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.List;
import java.util.UUID;

public record DeprecatedApiReportItemDto(
        UUID id,
        String code,
        String name,
        String apiVersion,
        String statusName,
        String governanceNote,
        UUID producerSystemId,
        String producerSystemName,
        String producerSystemIcon,
        List<DeprecationConsumerDto> consumers,
        int consumerCount,
        DeprecationRisk risk
) {}
