package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.com.ww.mesh.atlas.api.application.dto.ApiAttachmentDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiAttachmentUpdateRequest;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiAttachmentNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiAttachmentEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiAttachmentRepository;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.security.auth.UserContextHolder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiAttachmentService {

    private final ApiAttachmentRepository attachmentRepository;
    private final ApiService apiService;

    @Transactional(readOnly = true)
    public List<ApiAttachmentDto> findAll(UUID apiId) {
        apiService.getApiOrThrow(apiId);
        return attachmentRepository.findByApiId(apiId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApiAttachmentEntity download(UUID apiId, UUID attachmentId) {
        apiService.getApiOrThrow(apiId);
        return attachmentRepository.findByIdAndApiId(attachmentId, apiId)
                .orElseThrow(() -> new AtlasApiAttachmentNotFoundException(attachmentId.toString()));
    }

    @Transactional
    public ApiAttachmentDto addAttachment(UUID apiId, MultipartFile file, String description,
                                          UUID contractTypeId, String attachmentVersion, UUID attachmentStatusId) {
        ApiEntity api = apiService.getApiOrThrow(apiId);
        String currentUser = UserContextHolder.getCurrentUserOptional()
                .map(pl.com.ww.mesh.atlas.security.auth.AuthenticatedUser::id)
                .orElse("system");

        DictionaryEntryEntity contractType = apiService.resolveEntry(contractTypeId);
        DictionaryEntryEntity attachmentStatus = apiService.resolveEntry(attachmentStatusId);

        try {
            ApiAttachmentEntity attachment = ApiAttachmentEntity.builder()
                    .api(api)
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : file.getName())
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .fileSize(file.getSize())
                    .content(file.getBytes())
                    .description(description)
                    .contractType(contractType)
                    .attachmentVersion(attachmentVersion)
                    .attachmentStatus(attachmentStatus)
                    .createdAt(LocalDateTime.now())
                    .createdBy(currentUser)
                    .build();
            return toDto(attachmentRepository.save(attachment));
        } catch (IOException e) {
            throw new AtlasException("Failed to read uploaded file", e);
        }
    }

    @Transactional
    public ApiAttachmentDto updateAttachment(UUID apiId, UUID attachmentId, ApiAttachmentUpdateRequest request) {
        apiService.getApiOrThrow(apiId);
        ApiAttachmentEntity attachment = attachmentRepository.findByIdAndApiId(attachmentId, apiId)
                .orElseThrow(() -> new AtlasApiAttachmentNotFoundException(attachmentId.toString()));
        attachment.setDescription(request.description());
        attachment.setContractType(apiService.resolveEntry(request.contractTypeId()));
        attachment.setAttachmentVersion(request.attachmentVersion());
        attachment.setAttachmentStatus(apiService.resolveEntry(request.attachmentStatusId()));
        return toDto(attachmentRepository.save(attachment));
    }

    @Transactional
    public void deleteAttachment(UUID apiId, UUID attachmentId) {
        apiService.getApiOrThrow(apiId);
        ApiAttachmentEntity attachment = attachmentRepository.findByIdAndApiId(attachmentId, apiId)
                .orElseThrow(() -> new AtlasApiAttachmentNotFoundException(attachmentId.toString()));
        attachmentRepository.delete(attachment);
    }

    private ApiAttachmentDto toDto(ApiAttachmentEntity entity) {
        return new ApiAttachmentDto(
                entity.getId(),
                entity.getFileName(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getDescription(),
                toEntryRef(entity.getContractType()),
                entity.getAttachmentVersion(),
                toEntryRef(entity.getAttachmentStatus()),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }

    private pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto toEntryRef(
            pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryEntryEntity entry) {
        if (entry == null) return null;
        return new pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryRefDto(
                entry.getId(), entry.getCode(), entry.getName());
    }
}
