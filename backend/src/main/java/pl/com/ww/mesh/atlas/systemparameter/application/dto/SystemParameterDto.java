package pl.com.ww.mesh.atlas.systemparameter.application.dto;

import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record SystemParameterDto(
        UUID id,
        String parameterKey,
        String parameterName,
        SystemParameterType parameterType,
        String description,
        String category,
        String stringValue,
        Long integerValue,
        BigDecimal decimalValue,
        Boolean booleanValue,
        LocalDate dateValue,
        LocalDateTime datetimeValue,
        boolean systemDefined,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy,
        Long version
) {}
