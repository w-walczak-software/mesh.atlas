package pl.com.ww.mesh.atlas.analysis.application.dto;

import java.util.List;
import java.util.UUID;

public record WhatIfDecommissionedApiDto(
        UUID id,
        String code,
        String name,
        String apiVersion,
        String transportLayerName,
        String statusName,
        String slaTierName,
        List<String> dataDomainNames,
        int directConsumerCount
) {}
