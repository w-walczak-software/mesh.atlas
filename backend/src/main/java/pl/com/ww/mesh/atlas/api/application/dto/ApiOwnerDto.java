package pl.com.ww.mesh.atlas.api.application.dto;

import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ApiOwnerDto(
        UUID id,
        DictionaryEntryRefDto role,
        String firstName,
        String lastName,
        String email,
        LocalDate validFrom,
        LocalDate validTo,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}
