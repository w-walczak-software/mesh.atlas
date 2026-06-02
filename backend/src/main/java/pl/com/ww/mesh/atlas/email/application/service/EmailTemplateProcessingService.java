package pl.com.ww.mesh.atlas.email.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;
import pl.com.ww.mesh.atlas.email.domain.exception.EmailTemplateNotFoundException;
import pl.com.ww.mesh.atlas.email.domain.model.EmailTemplateEntity;
import pl.com.ww.mesh.atlas.email.infrastructure.persistence.EmailTemplateRepository;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailTemplateProcessingService {

    private final EmailTemplateRepository repository;

    private final SpringTemplateEngine templateEngine = buildEngine();

    public String processByCode(String code, Map<String, Object> variables) {
        String body = repository.findByCode(code)
                .filter(t -> t.isActive())
                .map(EmailTemplateEntity::getBody)
                .orElseThrow(() -> new EmailTemplateNotFoundException(code));
        return process(body, variables);
    }

    public String processById(UUID id, Map<String, Object> variables) {
        String body = repository.findById(id)
                .filter(t -> t.isActive())
                .map(EmailTemplateEntity::getBody)
                .orElseThrow(() -> new EmailTemplateNotFoundException(id.toString()));
        return process(body, variables);
    }

    public String process(String templateBody, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process(templateBody, context);
    }

    private static SpringTemplateEngine buildEngine() {
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        // SpringTemplateEngine uses SpringStandardDialect (SpEL) instead of StandardDialect (OGNL),
        // avoiding the ognl/PropertyAccessor NoClassDefFoundError in environments without OGNL.
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
