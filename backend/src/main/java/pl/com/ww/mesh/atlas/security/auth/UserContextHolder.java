package pl.com.ww.mesh.atlas.security.auth;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class UserContextHolder {

    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
    private static final String ROLES_CLAIM = "roles";

    private static volatile String configuredClientId;

    private UserContextHolder() {}

    /**
     * Returns the authenticated user or throws if the security context contains no JWT token.
     * Use in code that runs exclusively within an authenticated request.
     */
    public static AuthenticatedUser getCurrentUser() {
        return resolveFromContext()
                .orElseThrow(() -> new IllegalStateException(
                        "Security context does not contain a JWT authentication token"));
    }

    /**
     * Returns the authenticated user wrapped in Optional.
     * Use in code that may execute outside of an authenticated request context.
     */
    public static Optional<AuthenticatedUser> getCurrentUserOptional() {
        return resolveFromContext();
    }

    private static Optional<AuthenticatedUser> resolveFromContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return Optional.empty();
        }

        Jwt jwt = jwtAuth.getToken();

        Set<String> roles = Stream.concat(
                        extractRealmRoles(jwt),
                        extractClientRoles(jwt))
                .collect(Collectors.toUnmodifiableSet());

        return Optional.of(new AuthenticatedUser(
                jwt.getSubject(),
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                jwt.getClaimAsString("email"),
                roles
        ));
    }

    private static Stream<String> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap(REALM_ACCESS_CLAIM);
        if (realmAccess == null) {
            return Stream.empty();
        }
        return extractRolesFromClaim(realmAccess);
    }

    @SuppressWarnings("unchecked")
    private static Stream<String> extractClientRoles(Jwt jwt) {
        if (!StringUtils.hasText(configuredClientId)) {
            return Stream.empty();
        }
        Map<String, Object> resourceAccess = jwt.getClaimAsMap(RESOURCE_ACCESS_CLAIM);
        if (resourceAccess == null) {
            return Stream.empty();
        }
        Object clientEntry = resourceAccess.get(configuredClientId);
        if (!(clientEntry instanceof Map<?, ?> clientMap)) {
            return Stream.empty();
        }
        return extractRolesFromClaim((Map<String, Object>) clientMap);
    }

    @SuppressWarnings("unchecked")
    private static Stream<String> extractRolesFromClaim(Map<String, Object> claimMap) {
        Object roles = claimMap.get(ROLES_CLAIM);
        if (roles instanceof List<?> list) {
            return ((List<String>) list).stream();
        }
        return Stream.empty();
    }

    @Component
    static class Configurer {

        @Value("${app.security.keycloak.client-id}")
        private String clientId;

        @PostConstruct
        void configure() {
            UserContextHolder.configuredClientId = clientId;
        }
    }
}
