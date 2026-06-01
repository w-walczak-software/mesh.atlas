package pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KeycloakRoleRepresentation(
        String id,
        String name,
        String description,
        Boolean composite,
        Boolean clientRole
) {}
