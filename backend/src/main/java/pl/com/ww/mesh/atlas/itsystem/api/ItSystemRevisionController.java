package pl.com.ww.mesh.atlas.itsystem.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.global.audit.RevisionEntryDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemDto;
import pl.com.ww.mesh.atlas.itsystem.application.dto.ItSystemOwnerDto;
import pl.com.ww.mesh.atlas.itsystem.application.service.ItSystemRevisionService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/it-systems")
@RequiredArgsConstructor
public class ItSystemRevisionController {

    private final ItSystemRevisionService service;

    @GetMapping("/{id}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<ItSystemDto>> getRevisions(@PathVariable UUID id) {
        return service.getRevisions(id);
    }

    @GetMapping("/{systemId}/owners/{ownerId}/revisions")
    @IsAtlasUser
    public List<RevisionEntryDto<ItSystemOwnerDto>> getOwnerRevisions(
            @PathVariable UUID systemId,
            @PathVariable UUID ownerId) {
        return service.getOwnerRevisions(systemId, ownerId);
    }
}
