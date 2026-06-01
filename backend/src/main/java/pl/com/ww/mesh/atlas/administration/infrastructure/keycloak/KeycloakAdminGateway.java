package pl.com.ww.mesh.atlas.administration.infrastructure.keycloak;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import pl.com.ww.mesh.atlas.administration.domain.exception.AtlasAdminProviderException;
import pl.com.ww.mesh.atlas.administration.domain.exception.AtlasAdminUserNotFoundException;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakClientRepresentation;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakRoleRepresentation;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakTokenResponse;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model.KeycloakUserRepresentation;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RequiredArgsConstructor
public class KeycloakAdminGateway {

    private static final ParameterizedTypeReference<List<KeycloakUserRepresentation>> USER_LIST =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<KeycloakRoleRepresentation>> ROLE_LIST =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<KeycloakClientRepresentation>> CLIENT_LIST =
            new ParameterizedTypeReference<>() {};

    private final RestClient restClient;
    private final KeycloakAdminProperties props;

    private volatile String cachedToken;
    private volatile Instant tokenExpiry = Instant.EPOCH;
    private volatile String cachedClientInternalId;

    // ── Token ─────────────────────────────────────────────────────────────────

    private String getToken() {
        if (cachedToken == null || Instant.now().isAfter(tokenExpiry.minusSeconds(30))) {
            refreshToken();
        }
        return cachedToken;
    }

    private synchronized void refreshToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiry.minusSeconds(30))) {
            return;
        }
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "client_credentials");
            form.add("client_id", props.clientId());
            form.add("client_secret", props.clientSecret());

            KeycloakTokenResponse response = restClient.post()
                    .uri("/realms/{realm}/protocol/openid-connect/token", props.realm())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);

            Objects.requireNonNull(response, "Token response was null");
            cachedToken = response.accessToken();
            tokenExpiry = Instant.now().plusSeconds(response.expiresIn());
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Keycloak admin authentication failed", e);
        }
    }

    // ── Internal client UUID (lazy, cached) ───────────────────────────────────

    private String getClientInternalId() {
        if (cachedClientInternalId == null) {
            cachedClientInternalId = fetchClientInternalId();
        }
        return cachedClientInternalId;
    }

    private String fetchClientInternalId() {
        try {
            List<KeycloakClientRepresentation> clients = restClient.get()
                    .uri(b -> b.path("/admin/realms/{realm}/clients")
                            .queryParam("clientId", props.appClientId())
                            .queryParam("max", 1)
                            .build(props.realm()))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(CLIENT_LIST);
            if (clients == null || clients.isEmpty()) {
                throw new AtlasAdminProviderException(
                        "App client not found in Keycloak: " + props.appClientId());
            }
            return clients.getFirst().id();
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to resolve client internal ID", e);
        }
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    public List<KeycloakUserRepresentation> getUsers(String search, int first, int max) {
        try {
            return restClient.get()
                    .uri(b -> {
                        var builder = b.path("/admin/realms/{realm}/users")
                                .queryParam("first", first)
                                .queryParam("max", max)
                                .queryParam("briefRepresentation", false);
                        if (search != null && !search.isBlank()) {
                            builder = builder.queryParam("search", search);
                        }
                        return builder.build(props.realm());
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(USER_LIST);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch users from Keycloak", e);
        }
    }

    public long countUsers(String search) {
        try {
            Integer count = restClient.get()
                    .uri(b -> {
                        var builder = b.path("/admin/realms/{realm}/users/count");
                        if (search != null && !search.isBlank()) {
                            builder = builder.queryParam("search", search);
                        }
                        return builder.build(props.realm());
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(Integer.class);
            return count != null ? count : 0;
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to count users in Keycloak", e);
        }
    }

    public KeycloakUserRepresentation getUser(String userId) {
        try {
            return restClient.get()
                    .uri("/admin/realms/{realm}/users/{userId}", props.realm(), userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(KeycloakUserRepresentation.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AtlasAdminUserNotFoundException(userId);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch user from Keycloak: " + userId, e);
        }
    }

    // ── Realm role mappings ───────────────────────────────────────────────────

    public List<KeycloakRoleRepresentation> getUserRealmRoles(String userId) {
        try {
            return restClient.get()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm",
                            props.realm(), userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(ROLE_LIST);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AtlasAdminUserNotFoundException(userId);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch realm roles for user: " + userId, e);
        }
    }

    public void assignUserRealmRoles(String userId, List<KeycloakRoleRepresentation> roles) {
        if (roles.isEmpty()) return;
        try {
            restClient.post()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm",
                            props.realm(), userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(roles)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to assign realm roles for user: " + userId, e);
        }
    }

    public void revokeUserRealmRoles(String userId, List<KeycloakRoleRepresentation> roles) {
        if (roles.isEmpty()) return;
        try {
            restClient.method(HttpMethod.DELETE)
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/realm",
                            props.realm(), userId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(roles)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to revoke realm roles for user: " + userId, e);
        }
    }

    // ── Client role mappings ──────────────────────────────────────────────────

    public List<KeycloakRoleRepresentation> getUserClientRoles(String userId) {
        try {
            return restClient.get()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}",
                            props.realm(), userId, getClientInternalId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(ROLE_LIST);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AtlasAdminUserNotFoundException(userId);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch client roles for user: " + userId, e);
        }
    }

    public void assignUserClientRoles(String userId, List<KeycloakRoleRepresentation> roles) {
        if (roles.isEmpty()) return;
        try {
            restClient.post()
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}",
                            props.realm(), userId, getClientInternalId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(roles)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to assign client roles for user: " + userId, e);
        }
    }

    public void revokeUserClientRoles(String userId, List<KeycloakRoleRepresentation> roles) {
        if (roles.isEmpty()) return;
        try {
            restClient.method(HttpMethod.DELETE)
                    .uri("/admin/realms/{realm}/users/{userId}/role-mappings/clients/{clientId}",
                            props.realm(), userId, getClientInternalId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(roles)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to revoke client roles for user: " + userId, e);
        }
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    public List<KeycloakRoleRepresentation> getRealmRoles() {
        try {
            return restClient.get()
                    .uri(b -> b.path("/admin/realms/{realm}/roles")
                            .queryParam("max", 200)
                            .build(props.realm()))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(ROLE_LIST);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch realm roles from Keycloak", e);
        }
    }

    public List<KeycloakRoleRepresentation> getClientRoles() {
        try {
            return restClient.get()
                    .uri(b -> b.path("/admin/realms/{realm}/clients/{clientId}/roles")
                            .queryParam("max", 200)
                            .build(props.realm(), getClientInternalId()))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(ROLE_LIST);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch client roles from Keycloak", e);
        }
    }

    public List<KeycloakRoleRepresentation> getAllRoles() {
        List<KeycloakRoleRepresentation> all = new ArrayList<>(getRealmRoles());
        all.addAll(getClientRoles());
        return all;
    }

    public KeycloakRoleRepresentation getRealmRole(String roleName) {
        try {
            return restClient.get()
                    .uri("/admin/realms/{realm}/roles/{roleName}", props.realm(), roleName)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(KeycloakRoleRepresentation.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AtlasAdminProviderException("Realm role not found in Keycloak: " + roleName);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch realm role from Keycloak: " + roleName, e);
        }
    }

    public KeycloakRoleRepresentation getClientRole(String roleName) {
        try {
            return restClient.get()
                    .uri("/admin/realms/{realm}/clients/{clientId}/roles/{roleName}",
                            props.realm(), getClientInternalId(), roleName)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + getToken())
                    .retrieve()
                    .body(KeycloakRoleRepresentation.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AtlasAdminProviderException("Client role not found in Keycloak: " + roleName);
        } catch (RestClientException e) {
            throw new AtlasAdminProviderException("Failed to fetch client role from Keycloak: " + roleName, e);
        }
    }
}
