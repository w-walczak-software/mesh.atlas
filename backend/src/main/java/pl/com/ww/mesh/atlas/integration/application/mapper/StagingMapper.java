package pl.com.ww.mesh.atlas.integration.application.mapper;

import org.mapstruct.Mapper;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingApiDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingDataDomainDto;
import pl.com.ww.mesh.atlas.integration.application.dto.StagingItSystemDto;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingApiEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingDataDomainEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.StagingItSystemEntity;

@Mapper(componentModel = "spring")
public interface StagingMapper {

    StagingItSystemDto mapItSystem(StagingItSystemEntity entity);

    StagingApiDto mapApi(StagingApiEntity entity);

    StagingDataDomainDto mapDataDomain(StagingDataDomainEntity entity);
}
