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
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeTranslationRequest;
import pl.com.ww.mesh.atlas.dictionary.application.service.DictionaryTypeTranslationService;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasAdmin;
import pl.com.ww.mesh.atlas.security.auth.preauthorizers.IsAtlasUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dictionary-types/{typeId}/translations")
@RequiredArgsConstructor
public class DictionaryTypeTranslationController {

    private final DictionaryTypeTranslationService service;

    @GetMapping
    @IsAtlasUser
    public List<DictionaryTypeTranslationDto> findByTypeId(@PathVariable UUID typeId) {
        return service.findByTypeId(typeId);
    }

    @PutMapping("/{langCode}")
    @IsAtlasAdmin
    public DictionaryTypeTranslationDto save(
            @PathVariable UUID typeId,
            @PathVariable String langCode,
            @Valid @RequestBody DictionaryTypeTranslationRequest request) {
        return service.save(typeId, langCode, request);
    }

    @DeleteMapping("/{langCode}")
    @IsAtlasAdmin
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID typeId, @PathVariable String langCode) {
        service.delete(typeId, langCode);
    }
}
