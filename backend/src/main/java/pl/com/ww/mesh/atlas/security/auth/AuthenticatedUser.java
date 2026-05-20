package pl.com.ww.mesh.atlas.security.auth;

import java.util.Set;

public record AuthenticatedUser(
        String id,
        String firstName,
        String lastName,
        String email,
        Set<String> roles
) {}
