package pl.com.ww.mesh.atlas.api.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphResultDto;
import pl.com.ww.mesh.atlas.api.application.dto.ApiGraphSearchCriteria;
import pl.com.ww.mesh.atlas.api.application.service.ApiGraphService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

@RestController
@RequestMapping("/api/v1/apis/graph")
@RequiredArgsConstructor
public class ApiGraphController {

    private final ApiGraphService service;

    @PostMapping("/search")
    @IsAtlasUser
    public ApiGraphResultDto search(@RequestBody ApiGraphSearchCriteria criteria) {
        return service.findForGraph(criteria);
    }
}
