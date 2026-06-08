package pl.com.ww.mesh.atlas.api.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import pl.com.ww.mesh.atlas.api.application.dto.ExternalSubscriptionRequest;
import pl.com.ww.mesh.atlas.api.application.service.ApiSubscriptionService;

/**
 * Public endpoints for the future developer portal.
 * No authentication required — accessible by anonymous users.
 * Security is enforced via email confirmation tokens.
 */
@RestController
@RequestMapping("/api/v1/public/subscriptions")
@RequiredArgsConstructor
public class PublicSubscriptionController {

    private final ApiSubscriptionService subscriptionService;

    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiSubscriptionDto subscribe(@Valid @RequestBody ExternalSubscriptionRequest request) {
        return subscriptionService.subscribeExternal(request);
    }

    @GetMapping("/confirm/{token}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@PathVariable String token) {
        subscriptionService.confirmExternal(token);
    }

    @DeleteMapping("/unsubscribe/{token}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable String token) {
        subscriptionService.unsubscribeExternal(token);
    }
}
