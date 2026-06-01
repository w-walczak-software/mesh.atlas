package pl.com.ww.mesh.atlas.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.ssl.SslBundle;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.KeycloakAdminGateway;
import pl.com.ww.mesh.atlas.administration.infrastructure.keycloak.KeycloakAdminProperties;

import javax.net.ssl.SSLContext;
import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
@EnableConfigurationProperties(KeycloakAdminProperties.class)
public class KeycloakAdminConfig {

    @Bean
    public KeycloakAdminGateway keycloakAdminGateway(SslBundles sslBundles,
                                                      KeycloakAdminProperties props) {
        SslBundle bundle = sslBundles.getBundle("keycloak");
        SSLContext sslContext = bundle.createSslContext();
        HttpClient httpClient = HttpClient.newBuilder()
                .sslContext(sslContext)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        RestClient restClient = RestClient.builder()
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .baseUrl(props.serverUrl())
                .build();
        return new KeycloakAdminGateway(restClient, props);
    }
}
