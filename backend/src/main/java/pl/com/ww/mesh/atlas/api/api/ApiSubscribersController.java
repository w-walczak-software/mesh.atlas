package pl.com.ww.mesh.atlas.api.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSummaryDto;
import pl.com.ww.mesh.atlas.api.application.service.ApiSubscriptionService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.UUID;

/** Provides the subscriber list for a specific API — visible to API owners and ATLAS_ADMIN. */
@RestController
@RequestMapping("/api/v1/apis")
@RequiredArgsConstructor
public class ApiSubscribersController {

    private final ApiSubscriptionService subscriptionService;

    @GetMapping("/{apiId:[0-9a-fA-F-]{36}}/subscriptions")
    @IsAtlasUser
    public Page<ApiSubscriptionSummaryDto> findSubscribersForApi(
            @PathVariable UUID apiId,
            @PageableDefault(size = 20, sort = "subscribedAt") Pageable pageable) {
        return subscriptionService.findSubscribersForApi(apiId, pageable);
    }
}
