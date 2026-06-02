package pl.com.ww.mesh.atlas.systemparameter.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterDto;
import pl.com.ww.mesh.atlas.systemparameter.application.dto.SystemParameterUpdateRequest;
import pl.com.ww.mesh.atlas.systemparameter.application.mapper.SystemParameterMapper;
import pl.com.ww.mesh.atlas.systemparameter.domain.exception.SystemParameterNotFoundException;
import pl.com.ww.mesh.atlas.systemparameter.domain.model.SystemParameterEntity;
import pl.com.ww.mesh.atlas.systemparameter.infrastructure.persistence.SystemParameterRepository;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SystemParameterService {

    private final SystemParameterRepository repository;
    private final SystemParameterMapper mapper;
    private final AuditLogPublisher auditLogPublisher;

    @Transactional(readOnly = true)
    public Page<SystemParameterDto> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::map);
    }

    @Transactional(readOnly = true)
    public SystemParameterDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new SystemParameterNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public SystemParameterDto findByKey(String key) {
        return repository.findByParameterKey(key)
                .map(mapper::map)
                .orElseThrow(() -> new SystemParameterNotFoundException(key));
    }

    @Transactional
    public SystemParameterDto update(UUID id, SystemParameterUpdateRequest request) {
        SystemParameterEntity entity = repository.findById(id)
                .orElseThrow(() -> new SystemParameterNotFoundException(id.toString()));

        String oldValue = valueSnapshot(entity);
        mapper.updateEntity(request, entity);
        SystemParameterEntity saved = repository.save(entity);
        String newValue = valueSnapshot(saved);

        auditLogPublisher.publishSuccess(
                AuditCategory.ADMINISTRATION,
                AuditAction.CONFIGURATION_CHANGED,
                AuditResourceType.CONFIGURATION,
                saved.getId().toString(),
                saved.getParameterKey(),
                "System parameter value changed",
                Map.<String, Object>of(
                        "key", saved.getParameterKey(),
                        "oldValue", oldValue,
                        "newValue", newValue
                )
        );

        return mapper.map(saved);
    }

    private String valueSnapshot(SystemParameterEntity e) {
        return switch (e.getParameterType()) {
            case STRING -> String.valueOf(e.getStringValue());
            case INTEGER -> String.valueOf(e.getIntegerValue());
            case DECIMAL -> String.valueOf(e.getDecimalValue());
            case BOOLEAN -> String.valueOf(e.getBooleanValue());
            case DATE -> String.valueOf(e.getDateValue());
            case DATETIME -> String.valueOf(e.getDatetimeValue());
        };
    }
}
