package pl.com.ww.mesh.atlas.dictionary.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryEntryTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryEntryTranslationService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dictionary-entries/{entryId}/translations")
@RequiredArgsConstructor
public class DictionaryEntryTranslationController {

    private final DictionaryEntryTranslationService service;

    @GetMapping
    @IsAtlasUser
    public List<DictionaryEntryTranslationDto> findByEntryId(@PathVariable UUID entryId) {
        return service.findByEntryId(entryId);
    }

    @PutMapping("/{langCode}")
    @IsAtlasAdmin
    public DictionaryEntryTranslationDto save(
            @PathVariable UUID entryId,
            @PathVariable String langCode,
            @Valid @RequestBody DictionaryEntryTranslationRequest request) {
        return service.save(entryId, langCode, request);
    }

    @DeleteMapping("/{langCode}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID entryId, @PathVariable String langCode) {
        service.delete(entryId, langCode);
    }
}
