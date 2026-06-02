package pl.com.ww.mesh.atlas.email.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import pl.com.ww.mesh.atlas.email.application.dto.EmailConfigDto;
import pl.com.ww.mesh.atlas.email.application.dto.EmailConfigSaveRequest;
import pl.com.ww.mesh.atlas.email.application.dto.EmailLogDto;
import pl.com.ww.mesh.atlas.email.application.dto.TestEmailRequest;
import pl.com.ww.mesh.atlas.email.application.service.EmailConfigService;
import pl.com.ww.mesh.atlas.email.application.service.EmailService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;

@RestController
@RequestMapping("/api/v1/admin/email-config")
@RequiredArgsConstructor
public class EmailConfigController {

    private final EmailConfigService configService;
    private final EmailService emailService;

    @IsAtlasAdmin
    @GetMapping
    public EmailConfigDto get() {
        return configService.get();
    }

    @IsAtlasAdmin
    @PutMapping
    public EmailConfigDto save(@Valid @RequestBody EmailConfigSaveRequest request) {
        return configService.save(request);
    }

    @IsAtlasAdmin
    @PostMapping("/test")
    public void sendTest(@Valid @RequestBody TestEmailRequest request) {
        emailService.sendEmail(
                request.recipient(),
                "[mesh.atlas] Test email",
                "This is a test email sent from mesh.atlas to verify SMTP configuration.",
                true
        );
    }

    @IsAtlasAdmin
    @GetMapping("/log")
    public Page<EmailLogDto> getLogs(Pageable pageable) {
        return configService.getLogs(pageable);
    }
}
