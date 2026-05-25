package pl.com.ww.mesh.atlas.datadomain.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainAttachmentDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainCreateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSearchCriteria;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainSummaryDto;
import pl.com.ww.mesh.atlas.datadomain.application.dto.DataDomainUpdateRequest;
import pl.com.ww.mesh.atlas.datadomain.application.mapper.DataDomainMapper;
import pl.com.ww.mesh.atlas.datadomain.domain.exception.AtlasDataDomainAttachmentNotFoundException;
import pl.com.ww.mesh.atlas.datadomain.domain.exception.AtlasDataDomainDuplicateCodeException;
import pl.com.ww.mesh.atlas.datadomain.domain.exception.AtlasDataDomainNotFoundException;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainAttachmentEntity;
import pl.com.ww.mesh.atlas.datadomain.domain.model.DataDomainEntity;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainAttachmentRepository;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainRepository;
import pl.com.ww.mesh.atlas.datadomain.infrastructure.persistance.DataDomainSpecification;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryEntryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryEntryRepository;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DataDomainService {

    private final DataDomainRepository repository;
    private final DataDomainAttachmentRepository attachmentRepository;
    private final DataDomainMapper mapper;
    private final DictionaryEntryRepository entryRepository;

    @Transactional(readOnly = true)
    public Page<DataDomainSummaryDto> findAll(DataDomainSearchCriteria criteria, Pageable pageable) {
        return repository.findAll(new DataDomainSpecification(criteria), pageable)
                .map(mapper::mapSummary);
    }

    @Transactional(readOnly = true)
    public DataDomainDto findById(UUID id) {
        return repository.findById(id)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasDataDomainNotFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public DataDomainDto findByCode(String code) {
        return repository.findByCode(code)
                .map(mapper::map)
                .orElseThrow(() -> new AtlasDataDomainNotFoundException(code));
    }

    @Transactional
    public DataDomainDto create(DataDomainCreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new AtlasDataDomainDuplicateCodeException(request.code());
        }
        DataDomainEntity entity = mapper.map(request);
        entity.setGroup(resolveEntry(request.groupId()));
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public DataDomainDto update(UUID id, DataDomainUpdateRequest request) {
        DataDomainEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDataDomainNotFoundException(id.toString()));
        mapper.updateEntity(request, entity);
        entity.setGroup(resolveEntry(request.groupId()));
        return mapper.map(repository.save(entity));
    }

    @Transactional
    public void deactivate(UUID id) {
        DataDomainEntity entity = repository.findById(id)
                .orElseThrow(() -> new AtlasDataDomainNotFoundException(id.toString()));
        entity.setActive(false);
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<DataDomainAttachmentDto> findAttachments(UUID domainId) {
        if (!repository.existsById(domainId)) {
            throw new AtlasDataDomainNotFoundException(domainId.toString());
        }
        return attachmentRepository.findAllByDataDomainId(domainId)
                .stream()
                .map(mapper::mapAttachment)
                .toList();
    }

    @Transactional
    public DataDomainAttachmentDto uploadAttachment(UUID domainId, MultipartFile file, String description) {
        DataDomainEntity domain = loadDomain(domainId);
        try {
            String currentUser = UserContextHolder.getCurrentUserOptional()
                    .map(pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser::id)
                    .orElse("system");
            DataDomainAttachmentEntity attachment = DataDomainAttachmentEntity.builder()
                    .dataDomain(domain)
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : file.getName())
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .fileSize(file.getSize())
                    .content(file.getBytes())
                    .description(description)
                    .createdAt(LocalDateTime.now())
                    .createdBy(currentUser)
                    .build();
            return mapper.mapAttachment(attachmentRepository.save(attachment));
        } catch (IOException e) {
            throw new AtlasException("Failed to read uploaded file", e);
        }
    }

    @Transactional(readOnly = true)
    public DataDomainAttachmentEntity getAttachmentContent(UUID domainId, UUID attachmentId) {
        if (!repository.existsById(domainId)) {
            throw new AtlasDataDomainNotFoundException(domainId.toString());
        }
        return attachmentRepository.findByIdAndDataDomainId(attachmentId, domainId)
                .orElseThrow(() -> new AtlasDataDomainAttachmentNotFoundException(attachmentId.toString()));
    }

    @Transactional
    public DataDomainAttachmentDto updateAttachment(UUID domainId, UUID attachmentId, String description) {
        if (!repository.existsById(domainId)) {
            throw new AtlasDataDomainNotFoundException(domainId.toString());
        }
        DataDomainAttachmentEntity attachment = attachmentRepository
                .findByIdAndDataDomainId(attachmentId, domainId)
                .orElseThrow(() -> new AtlasDataDomainAttachmentNotFoundException(attachmentId.toString()));
        attachment.setDescription(description);
        return mapper.mapAttachment(attachmentRepository.save(attachment));
    }

    @Transactional
    public void deleteAttachment(UUID domainId, UUID attachmentId) {
        if (!repository.existsById(domainId)) {
            throw new AtlasDataDomainNotFoundException(domainId.toString());
        }
        DataDomainAttachmentEntity attachment = attachmentRepository
                .findByIdAndDataDomainId(attachmentId, domainId)
                .orElseThrow(() -> new AtlasDataDomainAttachmentNotFoundException(attachmentId.toString()));
        attachmentRepository.delete(attachment);
    }

    private DataDomainEntity loadDomain(UUID domainId) {
        return repository.findById(domainId)
                .orElseThrow(() -> new AtlasDataDomainNotFoundException(domainId.toString()));
    }

    private DictionaryEntryEntity resolveEntry(UUID id) {
        if (id == null) return null;
        return entryRepository.findById(id)
                .orElseThrow(() -> new AtlasDictionaryEntryNotFoundException(id.toString()));
    }
}
