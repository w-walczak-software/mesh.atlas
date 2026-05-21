package pl.com.ww.mesh.atlas.hello;

import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.security.auth.UserContextService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;


@Slf4j
@RestController()
@RequestMapping("/api/hello")
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
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
        }
        throw new AtlasDictionaryNotFoundException(name);
    }

}
