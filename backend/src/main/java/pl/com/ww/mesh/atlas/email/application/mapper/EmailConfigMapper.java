package pl.com.ww.mesh.atlas.email.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.email.application.dto.EmailConfigDto;
import pl.com.ww.mesh.atlas.email.domain.model.EmailConfigEntity;

@Mapper(componentModel = "spring")
public interface EmailConfigMapper {

    @Mapping(target = "provider",
            expression = "java(entity.getProvider() != null ? entity.getProvider().name() : null)")
    @Mapping(target = "encryption",
            expression = "java(entity.getEncryption() != null ? entity.getEncryption().name() : null)")
    @Mapping(target = "passwordSet",
            expression = "java(entity.getPassword() != null && !entity.getPassword().isBlank())")
    @Mapping(target = "updatedAt",
            expression = "java(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)")
    EmailConfigDto toDto(EmailConfigEntity entity);
}
