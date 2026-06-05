package pl.com.ww.mesh.atlas.analysis.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusRequest;
import pl.com.ww.mesh.atlas.analysis.application.dto.BlastRadiusResultDto;
import pl.com.ww.mesh.atlas.analysis.application.service.BlastRadiusService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

@RestController
@RequestMapping("/api/v1/analysis")
@RequiredArgsConstructor
public class BlastRadiusController {

    private final BlastRadiusService blastRadiusService;

    @IsAtlasUser
    @PostMapping("/blast-radius")
    public ResponseEntity<BlastRadiusResultDto> analyzeBlastRadius(@Valid @RequestBody BlastRadiusRequest request) {
        return ResponseEntity.ok(blastRadiusService.analyze(request));
    }
}
