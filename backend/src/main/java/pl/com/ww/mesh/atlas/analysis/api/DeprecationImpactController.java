package pl.com.ww.mesh.atlas.analysis.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.analysis.application.dto.DeprecationImpactResultDto;
import pl.com.ww.mesh.atlas.analysis.application.service.DeprecationImpactService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

@RestController
@RequestMapping("/api/v1/analysis")
@RequiredArgsConstructor
public class DeprecationImpactController {

    private final DeprecationImpactService deprecationImpactService;

    @IsAtlasUser
    @GetMapping("/deprecation-impact")
    public ResponseEntity<DeprecationImpactResultDto> analyze() {
        return ResponseEntity.ok(deprecationImpactService.analyze());
    }
}
