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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionAdminRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiSubscriptionDto;
import pl.com.ww.mesh.atlas.api.application.service.ApiSubscriptionService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@RequiredArgsConstructor
public class ApiAdminSubscriptionController {

    private final ApiSubscriptionService subscriptionService;

    @GetMapping
    @IsAtlasAdmin
    public Page<ApiSubscriptionDto> findAll(
            @PageableDefault(size = 20, sort = "subscribedAt") Pageable pageable) {
        return subscriptionService.findAll(pageable);
    }

    @PostMapping
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.CREATED)
    public ApiSubscriptionDto create(@Valid @RequestBody ApiSubscriptionAdminRequest request) {
        return subscriptionService.adminCreate(request);
    }

    @PutMapping("/{id:[0-9a-fA-F-]{36}}")
    @IsAtlasAdmin
    public ApiSubscriptionDto update(
            @PathVariable UUID id,
            @Valid @RequestBody ApiSubscriptionAdminRequest request) {
        return subscriptionService.adminUpdate(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        subscriptionService.adminDelete(id);
    }
}
