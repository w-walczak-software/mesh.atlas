package pl.com.ww.mesh.atlas.audit.aspect;

import pl.com.ww.mesh.atlas.audit.domain.model.AuditAction;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditCategory;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditResourceType;
import pl.com.ww.mesh.atlas.audit.domain.model.AuditSeverity;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service method for automatic audit logging.
 *
 * SpEL expressions in {@code resourceIdExpr} and {@code resourceNameExpr} have access to:
 * <ul>
 *   <li>{@code #result}   – method return value (after-returning only)</li>
 *   <li>{@code #args}     – Object[] of method arguments</li>
 *   <li>{@code #args[0]}  – first argument, etc.</li>
 * </ul>
 *
 * Example:
 * <pre>{@code
 * @AuditLogged(
 *     category      = AuditCategory.API_REGISTRY,
 *     action        = AuditAction.CREATE,
 *     resourceType  = AuditResourceType.API,
 *     resourceIdExpr   = "#result.id().toString()",
 *     resourceNameExpr = "#result.code()"
 * )
 * public ApiDto create(CreateApiRequest request) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditLogged {

    AuditCategory category();

    AuditAction action();

    AuditResourceType resourceType() default AuditResourceType.CONFIGURATION;

    AuditSeverity severity() default AuditSeverity.INFO;

    /** SpEL expression to resolve the resource ID from the method context. */
    String resourceIdExpr() default "";

    /** SpEL expression to resolve the resource display name from the method context. */
    String resourceNameExpr() default "";

    /** SpEL expression to build a human-readable message. */
    String messageExpr() default "";
}
