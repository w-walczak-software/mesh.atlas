package pl.com.ww.mesh.atlas.audit.aspect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import pl.com.ww.mesh.atlas.audit.application.service.AuditLogPublisher;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditOutcome;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private static final SpelExpressionParser PARSER = new SpelExpressionParser();

    private final AuditLogPublisher publisher;

    @Around("@annotation(auditLogged)")
    public Object audit(ProceedingJoinPoint jp, AuditLogged auditLogged) throws Throwable {
        try {
            Object result = jp.proceed();
            Object[] args = jp.getArgs();
            String resourceId   = evalExpr(auditLogged.resourceIdExpr(),   args, result);
            String resourceName = evalExpr(auditLogged.resourceNameExpr(),  args, result);
            String message      = evalExpr(auditLogged.messageExpr(),       args, result);
            publisher.publish(
                    auditLogged.category(),
                    auditLogged.action(),
                    auditLogged.resourceType(),
                    resourceId,
                    resourceName,
                    AuditOutcome.SUCCESS,
                    auditLogged.severity(),
                    message,
                    null,
                    null
            );
            return result;
        } catch (Exception ex) {
            publisher.publishFailure(
                    auditLogged.category(),
                    auditLogged.action(),
                    auditLogged.resourceType(),
                    null,
                    null,
                    ex.getMessage()
            );
            throw ex;
        }
    }

    private String evalExpr(String expr, Object[] args, Object result) {
        if (expr == null || expr.isBlank()) {
            return null;
        }
        try {
            EvaluationContext ctx = new StandardEvaluationContext();
            ctx.setVariable("result", result);
            ctx.setVariable("args", args);
            Object value = PARSER.parseExpression(expr).getValue(ctx);
            return value != null ? value.toString() : null;
        } catch (Exception ex) {
            log.debug("AuditLog SpEL evaluation failed for expression '{}': {}", expr, ex.getMessage());
            return null;
        }
    }
}
