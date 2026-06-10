package pl.com.ww.mesh.atlas.dictionary.application.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeCreateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeDto;
import pl.com.ww.mesh.atlas.dictionary.application.dto.DictionaryTypeUpdateRequest;
import pl.com.ww.mesh.atlas.dictionary.application.mapper.DictionaryTypeMapper;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryDuplicateCodeException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryModificationException;
import pl.com.ww.mesh.atlas.dictionary.domain.exception.AtlasDictionaryNotFoundException;
import pl.com.ww.mesh.atlas.dictionary.domain.model.DictionaryTypeEntity;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeRepository;
import pl.com.ww.mesh.atlas.dictionary.infrastructure.persistance.DictionaryTypeTranslationRepository;
import pl.com.ww.mesh.atlas.systemparameter.application.service.SystemParameterService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DictionaryTypeServiceTest {

    @Mock
    private DictionaryTypeRepository repository;
    @Mock
    private DictionaryTypeTranslationRepository translationRepository;
    @Mock
    private SystemParameterService systemParameterService;
    @Mock
    private DictionaryTypeMapper mapper;

    @InjectMocks
    private DictionaryTypeService service;

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_uniqueCode_savesEntityAndReturnsDto() {
        var request = new DictionaryTypeCreateRequest("API_STYLE", "API Style", null, false);
        var entity = entityWithId("API_STYLE");
        var dto = stubDto(entity.getId(), "API_STYLE");

        when(repository.existsByCode("API_STYLE")).thenReturn(false);
        when(mapper.map(request)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.map(entity)).thenReturn(dto);

        DictionaryTypeDto result = service.create(request);

        assertThat(result.code()).isEqualTo("API_STYLE");
        verify(repository).save(entity);
    }

    @Test
    void create_duplicateCode_throwsDuplicateCodeException() {
        var request = new DictionaryTypeCreateRequest("API_STYLE", "API Style", null, false);
        when(repository.existsByCode("API_STYLE")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(AtlasDictionaryDuplicateCodeException.class);
        verify(repository, never()).save(any());
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_exists_returnsDto() {
        var entity = entityWithId("SOME_CODE");
        var dto = stubDto(entity.getId(), "SOME_CODE");

        when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));
        when(systemParameterService.getDefaultLanguage()).thenReturn("en");
        when(translationRepository.findByDictionaryTypeIdAndLangCode(entity.getId(), "en"))
                .thenReturn(Optional.empty());
        when(mapper.map(entity)).thenReturn(dto);

        DictionaryTypeDto result = service.findById(entity.getId());

        assertThat(result.id()).isEqualTo(entity.getId());
    }

    @Test
    void findById_notFound_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(AtlasDictionaryNotFoundException.class);
    }

    // ── findByCode ────────────────────────────────────────────────────────────

    @Test
    void findByCode_notFound_throwsNotFoundException() {
        when(repository.findByCode("MISSING")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByCode("MISSING"))
                .isInstanceOf(AtlasDictionaryNotFoundException.class);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_notFound_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, new DictionaryTypeUpdateRequest("New Name", null, true)))
                .isInstanceOf(AtlasDictionaryNotFoundException.class);
    }

    @Test
    void update_exists_savesAndReturnsDto() {
        var entity = entityWithId("EXISTING");
        var dto = stubDto(entity.getId(), "EXISTING");
        when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        when(mapper.map(entity)).thenReturn(dto);

        DictionaryTypeDto result = service.update(entity.getId(), new DictionaryTypeUpdateRequest("New Name", null, true));

        verify(mapper).updateEntity(any(), any());
        assertThat(result).isEqualTo(dto);
    }

    // ── deactivate ────────────────────────────────────────────────────────────

    @Test
    void deactivate_notFound_throwsNotFoundException() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deactivate(id))
                .isInstanceOf(AtlasDictionaryNotFoundException.class);
    }

    @Test
    void deactivate_systemDefined_throwsModificationException() {
        var entity = entityWithId("SYS_CODE");
        entity.setSystemDefined(true);
        when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> service.deactivate(entity.getId()))
                .isInstanceOf(AtlasDictionaryModificationException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void deactivate_userDefined_setsActiveFalseAndSaves() {
        var entity = entityWithId("USER_CODE");
        entity.setSystemDefined(false);
        entity.setActive(true);
        when(repository.findById(entity.getId())).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);

        service.deactivate(entity.getId());

        ArgumentCaptor<DictionaryTypeEntity> captor = ArgumentCaptor.forClass(DictionaryTypeEntity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isFalse();
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_withActiveFilter_delegatesToFilteredQuery() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<DictionaryTypeEntity> emptyPage = new PageImpl<>(Collections.emptyList());
        when(repository.findAllByActive(true, pageable)).thenReturn(emptyPage);

        service.findAll(true, pageable);

        verify(repository).findAllByActive(true, pageable);
        verify(repository, never()).findAll(pageable);
    }

    @Test
    void findAll_withoutActiveFilter_delegatesToUnfilteredQuery() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<DictionaryTypeEntity> emptyPage = new PageImpl<>(Collections.emptyList());
        when(repository.findAll(pageable)).thenReturn(emptyPage);

        service.findAll(null, pageable);

        verify(repository).findAll(pageable);
        verify(repository, never()).findAllByActive(any(Boolean.class), any());
    }

    @Test
    void findAll_nonEmptyPage_appliesTranslations() {
        Pageable pageable = PageRequest.of(0, 10);
        var entity = entityWithId("CODE");
        Page<DictionaryTypeEntity> page = new PageImpl<>(List.of(entity));
        var dto = stubDto(entity.getId(), "CODE");

        when(repository.findAll(pageable)).thenReturn(page);
        when(systemParameterService.getDefaultLanguage()).thenReturn("pl");
        when(translationRepository.findByDictionaryTypeIdInAndLangCode(List.of(entity.getId()), "pl"))
                .thenReturn(Collections.emptyList());
        when(mapper.map(entity)).thenReturn(dto);

        Page<DictionaryTypeDto> result = service.findAll(null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private DictionaryTypeEntity entityWithId(String code) {
        var entity = new DictionaryTypeEntity();
        entity.setId(UUID.randomUUID());
        entity.setCode(code);
        entity.setName("Name for " + code);
        entity.setActive(true);
        return entity;
    }

    private DictionaryTypeDto stubDto(UUID id, String code) {
        return new DictionaryTypeDto(id, code, "Name", null, false, true, null, null, null, null);
    }
}
