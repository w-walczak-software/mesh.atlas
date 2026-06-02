package pl.com.ww.mesh.atlas.security.auth.preauthorizers;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole(T(pl.com.ww.mesh.atlas.security.auth.preauthorizers.AtlasRole).ATLAS_USER.name()) or hasRole(T(pl.com.ww.mesh.atlas.security.auth.preauthorizers.AtlasRole).ATLAS_SUPERUSER.name()) or hasRole(T(pl.com.ww.mesh.atlas.security.auth.preauthorizers.AtlasRole).ATLAS_ADMIN.name())")
public @interface IsAtlasUserOrAdmin {
}
