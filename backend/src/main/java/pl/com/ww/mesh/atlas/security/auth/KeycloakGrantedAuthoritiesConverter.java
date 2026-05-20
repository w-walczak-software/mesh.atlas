package pl.com.ww.mesh.atlas.security.auth;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Stream;

@Component
public class KeycloakGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
    private static final String ROLES_CLAIM = "roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Value("${app.security.keycloak.client-id}")
    private String clientId;

    @Override
    public Collection<GrantedAuthority> convert(@NonNull Jwt jwt) {
        Stream<String> realmRoles = extractRealmRoles(jwt);
        Stream<String> clientRoles = extractClientRoles(jwt);

        return Stream.concat(realmRoles, clientRoles)
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(ROLE_PREFIX + role.toUpperCase()))
                .toList();
    }

    private Stream<String> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaimAsMap(REALM_ACCESS_CLAIM);
        if (realmAccess == null) {
            return Stream.empty();
        }
        return extractRoles(realmAccess);
    }

    private Stream<String> extractClientRoles(Jwt jwt) {
        if (!StringUtils.hasText(clientId)) {
            return Stream.empty();
        }
        Map<String, Object> resourceAccess = jwt.getClaimAsMap(RESOURCE_ACCESS_CLAIM);
        if (resourceAccess == null) {
            return Stream.empty();
        }
        Object clientEntry = resourceAccess.get(clientId);
        if (!(clientEntry instanceof Map<?, ?> clientAccess)) {
            return Stream.empty();
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> typedClientAccess = (Map<String, Object>) clientAccess;
        return extractRoles(typedClientAccess);
    }

    @SuppressWarnings("unchecked")
    private Stream<String> extractRoles(Map<String, Object> claimMap) {
        Object roles = claimMap.get(ROLES_CLAIM);
        if (roles instanceof List<?> list) {
            return ((List<String>) list).stream();
        }
        return Stream.empty();
    }
}
