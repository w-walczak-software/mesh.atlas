package pl.com.ww.mesh.atlas.datadomain.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainCreateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSummaryDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainUpdateRequest;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainAttachmentEntity;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;

@Mapper(componentModel = "spring")
public interface DataDomainMapper {

    DataDomainDto map(DataDomainEntity entity);

    DataDomainDto mapSnapshot(DataDomainEntity entity);

    DataDomainSummaryDto mapSummary(DataDomainEntity entity);

    DataDomainAttachmentDto mapAttachment(DataDomainAttachmentEntity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "attachments", ignore = true)
    DataDomainEntity map(DataDomainCreateRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    void updateEntity(DataDomainUpdateRequest request, @MappingTarget DataDomainEntity entity);
}
