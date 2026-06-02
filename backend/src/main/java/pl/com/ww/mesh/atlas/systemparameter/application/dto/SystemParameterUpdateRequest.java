package pl.com.ww.mesh.atlas.systemparameter.application.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SystemParameterUpdateRequest(
        @Size(max = 200)
        String parameterName,

        @Size(max = 4000)
        String description,

        @Size(max = 100)
        String category,

        String stringValue,
        Long integerValue,
        BigDecimal decimalValue,
        Boolean booleanValue,
        LocalDate dateValue,
        LocalDateTime datetimeValue
) {}
