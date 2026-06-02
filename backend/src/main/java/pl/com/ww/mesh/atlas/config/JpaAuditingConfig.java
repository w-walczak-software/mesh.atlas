package pl.com.ww.mesh.atlas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> UserContextHolder.getCurrentUserOptional()
                .map(AuthenticatedUser::email)
                .or(() -> Optional.of("system"));
    }
}
