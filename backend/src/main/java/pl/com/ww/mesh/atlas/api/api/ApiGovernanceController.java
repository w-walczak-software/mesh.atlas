package pl.com.ww.mesh.atlas.api.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGovernancePendingCountDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSummaryDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiVerifyRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiGovernanceService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis/governance")
@RequiredArgsConstructor
public class ApiGovernanceController {

    private final ApiGovernanceService governanceService;

    @GetMapping("/pending-count")
    @IsAtlasUser
    public ApiGovernancePendingCountDto getPendingCount() {
        return governanceService.getPendingCount();
    }

    @GetMapping("/pending")
    @IsAtlasUser
    public Page<ApiSummaryDto> findPending(
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return governanceService.findPending(pageable);
    }

    @PostMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/approve")
    @IsAtlasUser
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(
            @PathVariable UUID id,
            @Valid @RequestBody ApiVerifyRequest request) {
        governanceService.approve(id, request);
    }

    @PostMapping("/{id:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/reject")
    @IsAtlasUser
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(
            @PathVariable UUID id,
            @Valid @RequestBody ApiVerifyRequest request) {
        governanceService.reject(id, request);
    }
}
