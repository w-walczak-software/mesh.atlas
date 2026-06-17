package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

import pl.com.ww.mesh.atlas.integration.domain.model.PipelineDictionaryMappingEntity;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Camel-accessible bean for translating external dictionary values to atlas entry IDs.
 * Instantiated per pipeline execution and registered in the child CamelContext registry.
 * Usable from XML DSL: <to uri="bean:camelDictionaryMapper?method=translateValue"/>
 */
public class CamelDictionaryMapper {

    private final Map<String, String> index;

    public CamelDictionaryMapper(List<PipelineDictionaryMappingEntity> mappings) {
        this.index = mappings.stream().collect(Collectors.toMap(
                m -> key(m.getDictionaryTypeCode(), m.getExternalValue()),
                m -> m.getAtlasEntry().getCode(),
                (a, b) -> a
        ));
    }

    public String translateValue(String dictionaryTypeCode, String externalValue) {
        if (externalValue == null) {
            return null;
        }
        return String.valueOf(index.get(key(dictionaryTypeCode, externalValue)));
    }


    private String key(String typeCode, String value) {
        return typeCode + "||" + value;
    }
}
