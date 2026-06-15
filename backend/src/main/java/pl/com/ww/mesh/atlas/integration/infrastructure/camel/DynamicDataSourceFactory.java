package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationDatasourceEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public final class DynamicDataSourceFactory {

    private DynamicDataSourceFactory() {}

    public static HikariDataSource build(IntegrationDatasourceEntity entity, String plainPassword) {
        return create(entity, plainPassword, 2, 5);
    }

    public static void testConnect(IntegrationDatasourceEntity entity, String plainPassword) throws SQLException {
        Properties props = new Properties();
        props.setProperty("user", entity.getUsername());
        props.setProperty("password", plainPassword);
        props.setProperty("connectTimeout", "10");         // PostgreSQL: seconds
        props.setProperty("loginTimeout", "10");           // SQL Server: seconds
        props.setProperty("oracle.net.CONNECT_TIMEOUT", "10000"); // Oracle: milliseconds
        try (Connection conn = DriverManager.getConnection(buildUrl(entity), props)) {
            conn.isValid(5);
        }
    }

    private static HikariDataSource create(IntegrationDatasourceEntity entity, String plainPassword,
                                            int poolSize, int timeoutSeconds) {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(buildUrl(entity));
        cfg.setUsername(entity.getUsername());
        cfg.setPassword(plainPassword);
        cfg.setMaximumPoolSize(poolSize);
        cfg.setMinimumIdle(1);
        cfg.setConnectionTimeout(timeoutSeconds * 1000L);
        cfg.setValidationTimeout(3000L);
        cfg.setPoolName("integration-" + entity.getCode());
        return new HikariDataSource(cfg);
    }

    private static String buildUrl(IntegrationDatasourceEntity entity) {
        return switch (entity.getType()) {
            case POSTGRESQL -> "jdbc:postgresql://%s:%d/%s".formatted(
                    entity.getHost(), entity.getPort(), entity.getDatabaseName());
            case SQLSERVER -> "jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=true;trustServerCertificate=true".formatted(
                    entity.getHost(), entity.getPort(), entity.getDatabaseName());
            case ORACLE -> "jdbc:oracle:thin:@%s:%d:%s".formatted(
                    entity.getHost(), entity.getPort(), entity.getDatabaseName());
        };
    }

    public static void close(DataSource ds) {
        if (ds instanceof HikariDataSource hds) {
            hds.close();
        }
    }
}
