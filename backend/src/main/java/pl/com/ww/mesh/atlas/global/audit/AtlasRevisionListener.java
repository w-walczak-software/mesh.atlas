package pl.com.ww.mesh.atlas.global.audit;

import org.hibernate.envers.RevisionListener;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.util.Optional;

public class AtlasRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {
        AtlasRevisionEntity rev = (AtlasRevisionEntity) revisionEntity;
        Optional<AuthenticatedUser> user = UserContextHolder.getCurrentUserOptional();
        user.ifPresent(u -> {
            rev.setUsername(u.email());
            rev.setUserId(u.id());
        });
    }
}
