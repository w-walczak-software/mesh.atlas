package pl.com.ww.mesh.atlas.api.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGovernancePendingCountDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiVerifyRequest;
import pl.com.ww.mesh.atlas.api.application.mapper.ApiMapper;
import pl.com.ww.mesh.atlas.api.domain.exception.AtlasApiNotFoundException;
import pl.com.ww.mesh.atlas.api.domain.model.ApiEntity;
import pl.com.ww.mesh.atlas.api.domain.model.ApiGovernanceReviewEntity;
import pl.com.ww.mesh.atlas.api.domain.model.GovernanceStatus;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiGovernanceReviewRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiRepository;
import pl.com.ww.mesh.atlas.api.infrastructure.persistance.ApiSpecification;
import pl.com.ww.mesh.atlas.global.GovernanceService;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasGovernanceViolationException;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ApiGovernanceService {

    private final ApiRepository apiRepository;
    private final ApiGovernanceReviewRepository reviewRepository;
    private final ApiMapper mapper;
    private final GovernanceService governanceService;
    private final UserContextService userContextService;

    @Transactional(readOnly = true)
    public ApiGovernancePendingCountDto getPendingCount() {
        var user = userContextService.getCurrentUser();
        Set<UUID> verifiableIds = governanceService.getVerifiableSystemIds(user.email());
        if (verifiableIds.isEmpty()) {
            return new ApiGovernancePendingCountDto(0);
        }
        long count = apiRepository.countByGovernanceStatusInAndProducerSystemIdIn(
                Set.of(GovernanceStatus.PENDING_VERIFICATION, GovernanceStatus.PENDING_REVIEW),
                verifiableIds);
        return new ApiGovernancePendingCountDto(count);
    }

    @Transactional(readOnly = true)
    public Page<ApiSummaryDto> findPending(Pageable pageable) {
        var user = userContextService.getCurrentUser();
        Set<UUID> verifiableIds = governanceService.getVerifiableSystemIds(user.email());
        var criteria = new ApiSearchCriteria(null, null, null, null, null, null, null, null, null, null, null, null, true);
        var spec = new ApiSpecification(criteria, user.email(), verifiableIds);
        return apiRepository.findAll(spec, pageable).map(mapper::mapSummary);
    }

    public void approve(UUID apiId, ApiVerifyRequest request) {
        ApiEntity api = getVerifiableApi(apiId);
        GovernanceStatus prev = api.getGovernanceStatus();
        api.setGovernanceStatus(GovernanceStatus.VERIFIED);
        api.setGovernanceNote(null);
        apiRepository.save(api);
        saveReview(api, "APPROVED", prev, GovernanceStatus.VERIFIED, request.note());
    }

    public void reject(UUID apiId, ApiVerifyRequest request) {
        ApiEntity api = getVerifiableApi(apiId);
        GovernanceStatus prev = api.getGovernanceStatus();
        GovernanceStatus next = (prev == GovernanceStatus.PENDING_REVIEW)
                ? GovernanceStatus.VERIFIED   // already published — stays visible, note added
                : GovernanceStatus.REQUIRES_MODIFICATION;
        api.setGovernanceStatus(next);
        api.setGovernanceNote(request.note());
        apiRepository.save(api);
        saveReview(api, "REJECTED", prev, next, request.note());
    }

    private ApiEntity getVerifiableApi(UUID apiId) {
        var user = userContextService.getCurrentUser();
        ApiEntity api = apiRepository.findById(apiId)
                .orElseThrow(() -> new AtlasApiNotFoundException(apiId.toString()));
        if (api.getGovernanceStatus() == GovernanceStatus.VERIFIED) {
            throw new AtlasGovernanceViolationException("API is already verified");
        }
        UUID producerSystemId = api.getProducerSystem() != null ? api.getProducerSystem().getId() : null;
        if (!governanceService.isVerifierForSystem(user.email(), producerSystemId)) {
            throw new AtlasGovernanceViolationException("Current user is not a verifier for the API's producer system");
        }
        return api;
    }

    private void saveReview(ApiEntity api, String action, GovernanceStatus prev, GovernanceStatus next, String note) {
        var user = userContextService.getCurrentUser();
        reviewRepository.save(ApiGovernanceReviewEntity.builder()
                .api(api)
                .action(action)
                .previousStatus(prev)
                .newStatus(next)
                .note(note)
                .reviewedAt(LocalDateTime.now())
                .reviewedBy(user.email())
                .build());
    }
}
