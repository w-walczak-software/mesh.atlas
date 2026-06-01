package pl.com.ww.mesh.atlas.audit.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.audit.application.dto.AuditLogEntryDto;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditLogEntry;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "eventTime",
            expression = "java(entry.getEventTime() != null ? entry.getEventTime().format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME) : null)")
    @Mapping(target = "category",
            expression = "java(entry.getCategory()     != null ? entry.getCategory().name()     : null)")
    @Mapping(target = "action",
            expression = "java(entry.getAction()       != null ? entry.getAction().name()       : null)")
    @Mapping(target = "resourceType",
            expression = "java(entry.getResourceType() != null ? entry.getResourceType().name() : null)")
    @Mapping(target = "outcome",
            expression = "java(entry.getOutcome()      != null ? entry.getOutcome().name()      : null)")
    @Mapping(target = "severity",
            expression = "java(entry.getSeverity()     != null ? entry.getSeverity().name()     : null)")
    AuditLogEntryDto toDto(AuditLogEntry entry);
}
