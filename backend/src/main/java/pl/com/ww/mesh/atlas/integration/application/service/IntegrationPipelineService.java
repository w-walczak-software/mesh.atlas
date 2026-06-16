package pl.com.ww.mesh.atlas.integration.application.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationPipelineUpdateRequest;
import pl.com.ww.mesh.atlas.integration.application.mapper.IntegrationPipelineMapper;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationDatasourceNotFoundException;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationPipelineNotFoundException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationDatasourceEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationPipelineEntity;
import pl.com.ww.mesh.atlas.integration.domain.model.PipelineStatus;
import pl.com.ww.mesh.atlas.integration.domain.model.TargetEntityType;
import pl.com.ww.mesh.atlas.integration.infrastructure.camel.CamelDslValidatorService;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.IntegrationDatasourceRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.IntegrationPipelineRepository;
import pl.com.ww.mesh.atlas.integration.infrastructure.scheduler.PipelineSchedulerService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IntegrationPipelineService {

    private final IntegrationPipelineRepository pipelineRepository;
    private final IntegrationDatasourceRepository datasourceRepository;
    private final IntegrationPipelineMapper mapper;
    private final CamelDslValidatorService camelDslValidator;
    private final PipelineSchedulerService schedulerService;

    public Page<IntegrationPipelineSummaryDto> findAll(
            Boolean active, String code, String name,
            PipelineStatus status, TargetEntityType targetEntity,
            Pageable pageable) {
        return pipelineRepository.findAll(buildSpec(active, code, name, status, targetEntity), pageable)
                .map(mapper::mapSummary);
    }

    private Specification<IntegrationPipelineEntity> buildSpec(
            Boolean active, String code, String name,
            PipelineStatus status, TargetEntityType targetEntity) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (code != null && !code.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("code")), "%" + code.toLowerCase() + "%"));
            }
            if (name != null && !name.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (targetEntity != null) {
                predicates.add(cb.equal(root.get("targetEntity"), targetEntity));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public IntegrationPipelineDto findById(UUID id) {
        return mapper.map(load(id));
    }

    public String getDsl(UUID id) {
        IntegrationPipelineEntity entity = load(id);
        if (entity.getCamelXmlDsl() == null) {
            throw new AtlasException("No DSL uploaded for pipeline: " + id,
                    "DSL_NOT_FOUND", id.toString(), HttpStatus.NOT_FOUND);
        }
        return entity.getCamelXmlDsl();
    }

    @Transactional
    public IntegrationPipelineDto create(IntegrationPipelineCreateRequest request) {
        if (pipelineRepository.existsByCode(request.code())) {
            throw new AtlasException("Pipeline code already exists: " + request.code(),
                    "DUPLICATE_CODE", request.code(), HttpStatus.CONFLICT);
        }
        IntegrationDatasourceEntity datasource = datasourceRepository.findById(request.datasourceId())
                .orElseThrow(() -> new IntegrationDatasourceNotFoundException(request.datasourceId()));

        IntegrationPipelineEntity entity = mapper.map(request);
        entity.setDatasource(datasource);
        entity = pipelineRepository.save(entity);

        Instant nextAt = schedulerService.scheduleOrUpdate(entity);
        entity.setNextExecutionAt(nextAt);

        return mapper.map(entity);
    }

    @Transactional
    public IntegrationPipelineDto update(UUID id, IntegrationPipelineUpdateRequest request) {
        IntegrationPipelineEntity entity = load(id);
        IntegrationDatasourceEntity datasource = datasourceRepository.findById(request.datasourceId())
                .orElseThrow(() -> new IntegrationDatasourceNotFoundException(request.datasourceId()));
        mapper.updateEntity(request, entity);
        entity.setDatasource(datasource);
        entity.setStatus(request.status());
        entity = pipelineRepository.save(entity);

        Instant nextAt = schedulerService.scheduleOrUpdate(entity);
        entity.setNextExecutionAt(nextAt);

        return mapper.map(entity);
    }

    @Transactional
    public IntegrationPipelineDto uploadDsl(UUID id, String xmlDsl) {
        camelDslValidator.validate(xmlDsl);
        IntegrationPipelineEntity entity = load(id);
        entity.setCamelXmlDsl(xmlDsl);
        return mapper.map(pipelineRepository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        IntegrationPipelineEntity entity = load(id);
        entity.setActive(false);
        entity.setNextExecutionAt(null);
        pipelineRepository.save(entity);
        schedulerService.removeJobIfExists(id);
    }

    IntegrationPipelineEntity load(UUID id) {
        return pipelineRepository.findById(id)
                .orElseThrow(() -> new IntegrationPipelineNotFoundException(id));
    }
}
