package pl.com.ww.mesh.atlas.analysis.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfRequest;
import pl.com.ww.mesh.atlas.analysis.application.dto.WhatIfResultDto;
import pl.com.ww.mesh.atlas.analysis.application.service.WhatIfService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

@RestController
@RequestMapping("/api/v1/analysis/what-if")
@RequiredArgsConstructor
public class WhatIfController {

    private final WhatIfService whatIfService;

    @PostMapping
    @IsAtlasUser
    public ResponseEntity<WhatIfResultDto> analyze(@Valid @RequestBody WhatIfRequest request) {
        return ResponseEntity.ok(whatIfService.analyze(request));
    }
}
