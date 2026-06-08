package pl.com.ww.mesh.atlas.changerequest.api;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestReviewRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSearchCriteria;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSubmitRequest;
import pl.com.ww.mesh.atlas.changerequest.application.dto.ChangeRequestSummaryDto;
import pl.com.ww.mesh.atlas.changerequest.application.dto.MarkImplementedRequest;
import pl.com.ww.mesh.atlas.changerequest.application.service.ChangeRequestService;
import pl.com.ww.mesh.atlas.changerequest.domain.model.ChangeRequestStatus;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/change-requests")
@RequiredArgsConstructor
public class ChangeRequestController {

    private final ChangeRequestService service;

    @PostMapping
    @IsAtlasUser
    @ResponseStatus(HttpStatus.CREATED)
    public ChangeRequestDto submit(@Valid @RequestBody ChangeRequestSubmitRequest request) {
        return service.submit(request);
    }

    @GetMapping
    @IsAtlasUser
    public Page<ChangeRequestSummaryDto> findAll(
            @RequestParam(required = false) UUID apiId,
            @RequestParam(required = false) ChangeRequestStatus status,
            @RequestParam(required = false) UUID changeTypeId,
            @RequestParam(required = false) UUID priorityId,
            @RequestParam(required = false) String requesterEmail,
            @RequestParam(required = false) String searchText,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        var criteria = new ChangeRequestSearchCriteria(
                apiId, status, changeTypeId, priorityId, requesterEmail, searchText, fromDate, toDate);
        return service.findAll(criteria, pageable);
    }

    @GetMapping("/my")
    @IsAtlasUser
    public Page<ChangeRequestSummaryDto> findMine(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return service.findMine(pageable);
    }

    @GetMapping("/{id:[0-9a-fA-F-]{36}}")
    @IsAtlasUser
    public ChangeRequestDto findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/review")
    @IsAtlasUser
    public ChangeRequestDto review(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeRequestReviewRequest request) {
        return service.review(id, request);
    }

    @PostMapping("/{id:[0-9a-fA-F-]{36}}/implement")
    @IsAtlasUser
    public ChangeRequestDto markImplemented(
            @PathVariable UUID id,
            @Valid @RequestBody MarkImplementedRequest request) {
        return service.markImplemented(id, request);
    }

    @DeleteMapping("/{id:[0-9a-fA-F-]{36}}")
    @IsAtlasUser
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID id) {
        service.cancel(id);
    }

    @GetMapping("/by-api/{apiId:[0-9a-fA-F-]{36}}")
    @IsAtlasUser
    public Page<ChangeRequestSummaryDto> findByApi(
            @PathVariable UUID apiId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return service.findByApi(apiId, pageable);
    }
}
