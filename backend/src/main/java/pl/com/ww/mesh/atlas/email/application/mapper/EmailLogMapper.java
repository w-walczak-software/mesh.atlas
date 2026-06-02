package pl.com.ww.mesh.atlas.email.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.email.application.dto.EmailLogDto;
import pl.com.ww.mesh.atlas.email.domain.model.EmailLogEntity;

@Mapper(componentModel = "spring")
public interface EmailLogMapper {

    @Mapping(target = "status",
            expression = "java(entity.getStatus() != null ? entity.getStatus().name() : null)")
    @Mapping(target = "sentAt",
            expression = "java(entity.getSentAt() != null ? entity.getSentAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)")
    EmailLogDto toDto(EmailLogEntity entity);
}
