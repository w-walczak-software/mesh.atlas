package pl.com.ww.mesh.atlas.hello;

import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataNotFoundException;
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

    @GetMapping("/test/{name}")
    @IsAtlasUser
    public String sayHello2(@PathVariable @NotNull @Validated String name) {
        var user = userContextService.getCurrentUser();
        log.info(user.id());
        throw new AtlasDataNotFoundException("test.not.found");
    }

}
