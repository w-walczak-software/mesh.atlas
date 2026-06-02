package pl.com.ww.mesh.atlas.email.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateSummaryDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailTemplateUpdateRequest;
import pl.com.ww.mesh.atlas.email.application.mapper.EmailTemplateMapper;
import pl.com.ww.mesh.atlas.email.domain.exception.EmailTemplateNotFoundException;
import pl.com.ww.mesh.atlas.email.domain.model.EmailTemplateEntity;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailTemplateRepository;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository repository;
    private final EmailTemplateMapper mapper;
    private final AuditLogPublisher auditLogPublisher;

    @Transactional(readOnly = true)
    public Page<EmailTemplateSummaryDto> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::mapSummary);
    }

    @Transactional(readOnly = true)
    public EmailTemplateDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new EmailTemplateNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public EmailTemplateDto findByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::map)
                .orElseThrow(() -> new EmailTemplateNotFoundException(code));
    }

    @Transactional
    public EmailTemplateDto update(UUID id, EmailTemplateUpdateRequest request) {
        EmailTemplateEntity entity = repository.findById(id)
                .orElseThrow(() -> new EmailTemplateNotFoundException(id.toString()));

        mapper.updateEntity(request, entity);
        EmailTemplateEntity saved = repository.save(entity);

        auditLogPublisher.publishSuccess(
                AuditCategory.ADMINISTRATION,
                AuditAction.UPDATE,
                AuditResourceType.EMAIL_TEMPLATE,
                saved.getId().toString(),
                saved.getCode(),
                "Email template updated",
                Map.of("code", saved.getCode())
        );

        return mapper.map(saved);
    }

    @Transactional
    public void deactivate(UUID id) {
        EmailTemplateEntity entity = repository.findById(id)
                .orElseThrow(() -> new EmailTemplateNotFoundException(id.toString()));

        entity.setActive(false);
        repository.save(entity);

        auditLogPublisher.publishSuccess(
                AuditCategory.ADMINISTRATION,
                AuditAction.DEACTIVATE,
                AuditResourceType.EMAIL_TEMPLATE,
                id.toString(),
                entity.getCode(),
                "Email template deactivated",
                Map.of("code", entity.getCode())
        );
    }
}
