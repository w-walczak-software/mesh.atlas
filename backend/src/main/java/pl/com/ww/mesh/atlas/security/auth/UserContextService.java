package pl.com.ww.mesh.atlas.security.auth;

import org.springframework.stereotype.Service;

@Service
public class UserContextService {

    public AuthenticatedUser getCurrentUser() {
        return UserContextHolder.getCurrentUser();
    }
}
