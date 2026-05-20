package pl.com.ww.mesh.atlas.api.hello;

import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;


@Slf4j
@RestController()
@RequestMapping("/hello")
@RequiredArgsConstructor
public class HelloController {

    private final UserContextService userContextService;

    @GetMapping("/{name}")
    @IsAtlasUser
    public String sayHello(@PathVariable @NotNull @Validated String name) {
        var user = userContextService.getCurrentUser();
        log.info(user.id());
        return "Hello "+name;
    }

}
