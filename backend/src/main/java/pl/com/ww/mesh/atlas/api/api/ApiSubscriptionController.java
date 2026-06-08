package pl.com.ww.mesh.atlas.api.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSelfRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionStatsDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionSummaryDto;
import pl.com.ww.mesh.atlas.api.application.service.ApiSubscriptionService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class ApiSubscriptionController {

    private final ApiSubscriptionService subscriptionService;

    @PostMapping
    @IsAtlasUser
    @ResponseStatus(HttpStatus.CREATED)
    public ApiSubscriptionDto subscribe(@Valid @RequestBody ApiSubscriptionSelfRequest request) {
        return subscriptionService.subscribe(request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @IsAtlasUser
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable UUID id) {
        subscriptionService.unsubscribeSelf(id);
    }

    @GetMapping("/my")
    @IsAtlasUser
    public Page<ApiSubscriptionSummaryDto> mySubscriptions(
            @PageableDefault(size = 20, sort = "subscribedAt") Pageable pageable) {
        return subscriptionService.findMySubscriptions(pageable);
    }

    @GetMapping("/stats")
    @IsAtlasUser
    public ApiSubscriptionStatsDto stats() {
        return subscriptionService.getStats();
    }
}
