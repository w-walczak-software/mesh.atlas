package pl.com.ww.mesh.atlas.email.application.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.email.domain.exception.EmailConfigNotFoundException;
import pl.com.ww.mesh.atlas.email.domain.exception.EmailSendException;
import pl.com.ww.mesh.atlas.email.domain.model.EmailConfigEntity;
import pl.com.ww.mesh.atlas.email.domain.model.EmailEncryption;
import pl.com.ww.mesh.atlas.email.domain.model.EmailLogEntity;
import pl.com.ww.mesh.atlas.email.domain.model.EmailSendStatus;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailConfigRepository;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailLogRepository;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Properties;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String DEFAULT_KEY = "default";
    private static final int ERROR_MESSAGE_MAX_LENGTH = 2000;

    private final EmailConfigRepository configRepository;
    private final EmailLogRepository logRepository;
    private final AuditLogPublisher auditLogPublisher;

    public void sendEmail(String to, String subject, String body, boolean isTest) {
        EmailConfigEntity config = configRepository.findByConfigKey(DEFAULT_KEY)
                .orElseThrow(EmailConfigNotFoundException::new);

        if (!config.isEnabled()) {
            throw new EmailSendException("Email sending is disabled. Enable it in Administration → Email Settings.");
        }

        String sentBy = UserContextHolder.getCurrentUserOptional()
                .map(AuthenticatedUser::email)
                .orElse("system");

        EmailLogEntity log = EmailLogEntity.builder()
                .sentAt(LocalDateTime.now())
                .recipient(to)
                .subject(subject)
                .sentBy(sentBy)
                .test(isTest)
                .build();

        try {
            JavaMailSenderImpl sender = buildSender(config);
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            InternetAddress from;
            if (StringUtils.hasText(config.getFromDisplayName())) {
                from = new InternetAddress(config.getFromAddress(), config.getFromDisplayName(), StandardCharsets.UTF_8.name());
            } else {
                from = new InternetAddress(config.getFromAddress());
            }
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            sender.send(message);

            log.setStatus(EmailSendStatus.SENT);
            logRepository.save(log);

            auditLogPublisher.publishSuccess(
                    AuditCategory.ADMINISTRATION,
                    AuditAction.EMAIL_SENT,
                    AuditResourceType.EMAIL_CONFIG,
                    null,
                    to,
                    isTest ? "Test email sent" : "Email sent",
                    Map.of("recipient", to, "subject", subject, "isTest", isTest)
            );

        } catch (Exception e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.length() > ERROR_MESSAGE_MAX_LENGTH) {
                errorMsg = errorMsg.substring(0, ERROR_MESSAGE_MAX_LENGTH);
            }

            log.setStatus(EmailSendStatus.FAILED);
            log.setErrorMessage(errorMsg);
            logRepository.save(log);

            auditLogPublisher.publishFailure(
                    AuditCategory.ADMINISTRATION,
                    AuditAction.EMAIL_SENT,
                    AuditResourceType.EMAIL_CONFIG,
                    null,
                    to,
                    e.getMessage()
            );

            throw new EmailSendException(e.getMessage() != null ? e.getMessage() : "Unknown error", e);
        }
    }

    private JavaMailSenderImpl buildSender(EmailConfigEntity config) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.getHost());
        sender.setPort(config.getPort());
        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        if (StringUtils.hasText(config.getUsername())) {
            sender.setUsername(config.getUsername());
        }
        if (StringUtils.hasText(config.getPassword())) {
            sender.setPassword(config.getPassword());
        }

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", StringUtils.hasText(config.getPassword()));
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        if (config.getEncryption() == EmailEncryption.TLS) {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        } else if (config.getEncryption() == EmailEncryption.SSL) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.ssl.trust", config.getHost());
        }

        return sender;
    }
}
