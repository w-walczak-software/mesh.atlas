package pl.com.ww.mesh.atlas.profile.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.profile.application.dto.UserProfileDto;
import pl.com.ww.mesh.atlas.profile.application.service.UserProfileService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService service;

    @GetMapping
    @IsAtlasUser
    public UserProfileDto getMyProfile() {
        return service.getProfile();
    }
}
