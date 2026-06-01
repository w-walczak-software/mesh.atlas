package pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KeycloakClientRepresentation(
        String id,
        String clientId
) {}
