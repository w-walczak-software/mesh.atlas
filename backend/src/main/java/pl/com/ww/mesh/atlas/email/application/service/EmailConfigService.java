package pl.com.ww.mesh.atlas.email.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.email.application.dto.EmailConfigDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailConfigSaveRequest;
import pl.com.ww.mesh.atlas.email.application.dto.EmailLogDto;
import pl.com.ww.mesh.atlas.email.application.mapper.EmailConfigMapper;
import pl.com.ww.mesh.atlas.email.application.mapper.EmailLogMapper;
import pl.com.ww.mesh.atlas.email.domain.exception.EmailConfigNotFoundException;
import pl.com.ww.mesh.atlas.email.domain.model.EmailConfigEntity;
import pl.com.ww.mesh.atlas.email.domain.model.EmailEncryption;
import pl.com.ww.mesh.atlas.email.domain.model.EmailProvider;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailConfigRepository;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailLogRepository;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailConfigService {

    private static final String DEFAULT_KEY = "default";

    private final EmailConfigRepository configRepository;
    private final EmailLogRepository logRepository;
    private final EmailConfigMapper configMapper;
    private final EmailLogMapper logMapper;
    private final AuditLogPublisher auditLogPublisher;

    @Transactional(readOnly = true)
    public EmailConfigDto get() {
        return configRepository.findByConfigKey(DEFAULT_KEY)
                .map(configMapper::toDto)
                .orElseThrow(EmailConfigNotFoundException::new);
    }

    @Transactional
    public EmailConfigDto save(EmailConfigSaveRequest request) {
        EmailConfigEntity entity = configRepository.findByConfigKey(DEFAULT_KEY)
                .orElseThrow(EmailConfigNotFoundException::new);

        entity.setProvider(EmailProvider.valueOf(request.provider()));
        entity.setHost(request.host());
        entity.setPort(request.port());
        entity.setUsername(request.username());
        if (StringUtils.hasText(request.password())) {
            entity.setPassword(request.password());
        }
        entity.setFromAddress(request.fromAddress());
        entity.setFromDisplayName(request.fromDisplayName());
        entity.setEncryption(EmailEncryption.valueOf(request.encryption()));
        entity.setEnabled(request.enabled());

        EmailConfigEntity saved = configRepository.save(entity);

        auditLogPublisher.publishSuccess(
                AuditCategory.ADMINISTRATION,
                AuditAction.CONFIGURATION_CHANGED,
                AuditResourceType.EMAIL_CONFIG,
                saved.getId().toString(),
                "Email Configuration",
                "Email SMTP configuration updated",
                Map.of(
                        "provider", saved.getProvider().name(),
                        "host", saved.getHost() != null ? saved.getHost() : "",
                        "port", saved.getPort(),
                        "encryption", saved.getEncryption().name(),
                        "enabled", saved.isEnabled()
                )
        );

        return configMapper.toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<EmailLogDto> getLogs(Pageable pageable) {
        return logRepository.findAllByOrderBySentAtDesc(pageable).map(logMapper::toDto);
    }
}
