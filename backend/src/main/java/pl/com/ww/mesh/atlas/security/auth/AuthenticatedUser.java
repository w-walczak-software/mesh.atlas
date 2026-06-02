package pl.com.ww.mesh.atlas.security.auth;

import java.util.Set;

public record AuthenticatedUser(
        String id,
        String firstName,
        String lastName,
        String email,
        Set<String> roles
) {
    public boolean isPrivileged() {
        return roles.stream().anyMatch(r ->
            r.equalsIgnoreCase("ATLAS_ADMIN") || r.equalsIgnoreCase("ATLAS_SUPERUSER"));
    }
}
