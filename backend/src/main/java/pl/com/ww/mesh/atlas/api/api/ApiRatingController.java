package pl.com.ww.mesh.atlas.api.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingRequest;
import pl.com.ww.mesh.atlas.api.application.dto.ApiRatingSummaryDto;
import pl.com.ww.mesh.atlas.api.application.service.ApiRatingService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apis/{apiId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}/ratings")
@RequiredArgsConstructor
public class ApiRatingController {

    private final ApiRatingService service;

    @IsAtlasUser
    @PostMapping
    public ApiRatingDto rate(
            @PathVariable UUID apiId,
            @Valid @RequestBody ApiRatingRequest request) {
        return service.rate(apiId, request);
    }

    @IsAtlasUser
    @GetMapping("/my")
    public ResponseEntity<ApiRatingDto> getMyRating(@PathVariable UUID apiId) {
        return service.getMyRating(apiId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @IsAtlasUser
    @GetMapping("/summary")
    public ApiRatingSummaryDto getSummary(@PathVariable UUID apiId) {
        return service.getSummary(apiId);
    }

    @IsAtlasUser
    @DeleteMapping("/my")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyRating(@PathVariable UUID apiId) {
        service.deleteMyRating(apiId);
    }
}
