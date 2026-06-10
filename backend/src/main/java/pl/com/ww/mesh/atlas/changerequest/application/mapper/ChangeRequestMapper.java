package pl.com.ww.mesh.atlas.changerequest.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMapper;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestReviewDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSummaryDto;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestEntity;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestReviewEntity;

@Mapper(componentModel = "spring", uses = {ApiMapper.class})
public interface ChangeRequestMapper {

    @Mapping(target = "apiId",             source = "api.id")
    @Mapping(target = "apiCode",           source = "api.code")
    @Mapping(target = "apiName",           source = "api.name")
    @Mapping(target = "apiVersion",        source = "api.apiVersion")
    @Mapping(target = "producerSystemName", source = "api.producerSystem.name")
    ChangeRequestDto map(ChangeRequestEntity entity);

    @Mapping(target = "apiId",             source = "api.id")
    @Mapping(target = "apiCode",           source = "api.code")
    @Mapping(target = "apiName",           source = "api.name")
    @Mapping(target = "apiVersion",        source = "api.apiVersion")
    @Mapping(target = "currentUserIsOwner", constant = "false")
    @Mapping(target = "currentUserIsRequester", constant = "false")
    ChangeRequestSummaryDto mapSummary(ChangeRequestEntity entity);

    default ChangeRequestSummaryDto mapSummary(ChangeRequestEntity entity, boolean currentUserIsOwner, boolean currentUserIsRequester) {
        ChangeRequestSummaryDto base = mapSummary(entity);
        return new ChangeRequestSummaryDto(
                base.id(), base.apiId(), base.apiCode(), base.apiName(), base.apiVersion(),
                base.title(), base.changeType(), base.priority(), base.status(),
                base.requesterType(), base.requesterEmail(), base.requesterName(),
                base.plannedImplementationDate(), base.plannedVersion(), base.createdAt(),
                currentUserIsOwner, currentUserIsRequester
        );
    }

    ChangeRequestReviewDto mapReview(ChangeRequestReviewEntity entity);
}
