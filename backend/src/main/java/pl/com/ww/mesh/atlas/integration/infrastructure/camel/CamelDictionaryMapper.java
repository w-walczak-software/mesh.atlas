package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

import pl.com.ww.mesh.atlas.integration.domain.model.PipelineDictionaryMappingEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Camel-accessible bean for translating external dictionary values to atlas entry IDs.
 * Instantiated per pipeline execution and registered in the child CamelContext registry.
 * Usable from XML DSL: <to uri="bean:camelDictionaryMapper?method=translateValue"/>
 */
public class CamelDictionaryMapper {

    private final Map<String, UUID> index;

    public CamelDictionaryMapper(List<PipelineDictionaryMappingEntity> mappings) {
        this.index = mappings.stream().collect(Collectors.toMap(
                m -> key(m.getDictionaryTypeCode(), m.getExternalValue()),
                m -> m.getAtlasEntry().getId(),
                (a, b) -> a
        ));
    }

    public Optional<UUID> translateValue(String dictionaryTypeCode, String externalValue) {
        if (externalValue == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(index.get(key(dictionaryTypeCode, externalValue)));
    }

    private String key(String typeCode, String value) {
        return typeCode + "||" + value;
    }
}
