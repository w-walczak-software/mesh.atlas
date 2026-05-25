package pl.com.ww.mesh.atlas.transportlayer.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.itsystem.domain.model.ItSystemEntity;
import pl.com.ww.mesh.atlas.itsystem.infrastructure.persistance.ItSystemRepository;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerCreateRequest;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSearchCriteria;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerSummaryDto;
import pl.com.ww.mesh.atlas.transportlayer.application.dto.TransportLayerUpdateRequest;
import pl.com.ww.mesh.atlas.transportlayer.application.mapper.TransportLayerMapper;
import pl.com.ww.mesh.atlas.transportlayer.domain.exception.AtlasTransportLayerDuplicateCodeException;
import pl.com.ww.mesh.atlas.transportlayer.domain.exception.AtlasTransportLayerNotFoundException;
import pl.com.ww.mesh.atlas.transportlayer.domain.model.TransportLayerEntity;
import pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance.TransportLayerRepository;
import pl.com.ww.mesh.atlas.transportlayer.infrastructure.persistance.TransportLayerSpecification;
import pl.com.ww.mesh.atlas.itsystem.domain.exception.AtlasItSystemNotFoundException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransportLayerService {

    private final TransportLayerRepository repository;
    private final TransportLayerMapper mapper;
    private final ItSystemRepository itSystemRepository;

    @Transactional(readOnly = true)
    public Page<TransportLayerSummaryDto> findAll(TransportLayerSearchCriteria criteria, Pageable pageable) {
        return repository.findAll(new TransportLayerSpecification(criteria), pageable)
                .map(mapper::mapSummary);
    }

    @Transactional(readOnly = true)
    public TransportLayerDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasTransportLayerNotFoundException(id.toString()));
    }

    @Transactional
    public TransportLayerDto create(TransportLayerCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new AtlasTransportLayerDuplicateCodeException(request.code());
        }
        TransportLayerEntity entity = mapper.map(request);
        applyItSystemRef(entity, request.itSystemId());
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public TransportLayerDto update(UUID id, TransportLayerUpdateRequest request) {
        TransportLayerEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasTransportLayerNotFoundException(id.toString()));
        mapper.updateEntity(request, entity);
        applyItSystemRef(entity, request.itSystemId());
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        TransportLayerEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasTransportLayerNotFoundException(id.toString()));
        entity.setActive(false);
        repository.save(entity);
    }

    private void applyItSystemRef(TransportLayerEntity entity, UUID itSystemId) {
        if (itSystemId == null) {
            entity.setItSystem(null);
            return;
        }
        ItSystemEntity system = itSystemRepository.findById(itSystemId)
                .orElseThrow(() -> new AtlasItSystemNotFoundException(itSystemId.toString()));
        entity.setItSystem(system);
    }
}
