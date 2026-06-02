package pl.com.ww.mesh.atlas.email.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateCreateRequest;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateSummaryDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateUpdateRequest;
import pl.com.ww.mesh.atlas.email.domain.model.EmailTemplateEntity;

@Mapper(componentModel = "spring")
public interface EmailTemplateMapper {

    EmailTemplateDto map(EmailTemplateEntity entity);

    EmailTemplateSummaryDto mapSummary(EmailTemplateEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", ignore = true)
    EmailTemplateEntity map(EmailTemplateCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    void updateEntity(EmailTemplateUpdateRequest request, @MappingTarget EmailTemplateEntity entity);
}
