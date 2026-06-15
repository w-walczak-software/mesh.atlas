package pl.com.ww.mesh.atlas.integration.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceCreateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceSummaryDto;
import pl.com.ww.mesh.atlas.integration.application.dto.IntegrationDatasourceUpdateRequest;
import pl.com.ww.mesh.atlas.integration.application.dto.TestConnectionResult;
import pl.com.ww.mesh.atlas.integration.application.mapper.IntegrationDatasourceMapper;
import pl.com.ww.mesh.atlas.integration.domain.exception.IntegrationDatasourceNotFoundException;
import pl.com.ww.mesh.atlas.integration.domain.model.IntegrationDatasourceEntity;
import pl.com.ww.mesh.atlas.integration.infrastructure.camel.DynamicDataSourceFactory;
import pl.com.ww.mesh.atlas.integration.infrastructure.encryption.IntegrationEncryptionService;
import pl.com.ww.mesh.atlas.integration.infrastructure.persistence.IntegrationDatasourceRepository;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IntegrationDatasourceService {

    private final IntegrationDatasourceRepository repository;
    private final IntegrationDatasourceMapper mapper;
    private final IntegrationEncryptionService encryptionService;

    public Page<IntegrationDatasourceSummaryDto> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::mapSummary);
    }

    public IntegrationDatasourceDto findById(UUID id) {
        return mapper.map(load(id));
    }

    @Transactional
    public IntegrationDatasourceDto create(IntegrationDatasourceCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new pl.com.ww.mesh.atlas.global.domain.exception.AtlasException(
                    "Datasource code already exists: " + request.code(), "DUPLICATE_CODE",
                    request.code(), org.springframework.http.HttpStatus.CONFLICT);
        }
        IntegrationDatasourceEntity entity = mapper.map(request);
        UUID saltId = UUID.nameUUIDFromBytes(request.code().getBytes(StandardCharsets.UTF_8));
        entity.setEncryptedPassword(encryptionService.encrypt(request.password(), saltId));
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public IntegrationDatasourceDto update(UUID id, IntegrationDatasourceUpdateRequest request) {
        IntegrationDatasourceEntity entity = load(id);
        mapper.updateEntity(request, entity);
        if (request.password() != null && !request.password().isBlank()) {
            UUID saltId = UUID.nameUUIDFromBytes(entity.getCode().getBytes(StandardCharsets.UTF_8));
            entity.setEncryptedPassword(encryptionService.encrypt(request.password(), saltId));
        }
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        IntegrationDatasourceEntity entity = load(id);
        entity.setActive(false);
        repository.save(entity);
    }

    public TestConnectionResult testConnection(UUID id) {
        IntegrationDatasourceEntity entity = load(id);
        UUID saltId = UUID.nameUUIDFromBytes(entity.getCode().getBytes(StandardCharsets.UTF_8));
        String password = encryptionService.decrypt(entity.getEncryptedPassword(), saltId);
        log.info("Testing connection for datasource [{}] -> {}:{}/{}", entity.getCode(), entity.getHost(), entity.getPort(), entity.getDatabaseName());
        try {
            DynamicDataSourceFactory.testConnect(entity, password);
            log.info("Connection test successful for datasource [{}]", entity.getCode());
            return new TestConnectionResult(true, "Connection successful");
        } catch (java.sql.SQLException e) {
            log.warn("Connection test failed for datasource [{}] {}:{}/{} sqlState={}: {}",
                    entity.getCode(), entity.getHost(), entity.getPort(), entity.getDatabaseName(), e.getSQLState(), e.getMessage(), e);
            return new TestConnectionResult(false, resolveSqlError(e, entity));
        } catch (Exception e) {
            log.warn("Connection test failed for datasource [{}] {}:{}/{}: {}",
                    entity.getCode(), entity.getHost(), entity.getPort(), entity.getDatabaseName(), e.getMessage(), e);
            return new TestConnectionResult(false, sanitize(e.getMessage()));
        }
    }

    private String resolveSqlError(java.sql.SQLException e, IntegrationDatasourceEntity entity) {
        String state = e.getSQLState();
        if (state == null) return sanitize(e.getMessage());
        return switch (state) {
            case "28P01", "28000" -> "Authentication failed for user: " + entity.getUsername();
            case "3D000" -> "Database not found: " + entity.getDatabaseName();
            case "08001", "08004", "08006", "08000" ->
                    "Cannot connect to %s:%d".formatted(entity.getHost(), entity.getPort());
            default -> sanitize(e.getMessage());
        };
    }

    private String sanitize(String message) {
        if (message == null) return "Unknown error";
        return message.replace("�", "?").replaceAll("[\\p{Cc}&&[^\t\n\r]]", "");
    }

    private IntegrationDatasourceEntity load(UUID id) {
        return repository.findById(id).orElseThrow(() -> new IntegrationDatasourceNotFoundException(id));
    }
}
