package pl.com.ww.mesh.atlas.integration.infrastructure.camel;

import lombok.extern.slf4j.Slf4j;
import org.apache.camel.impl.DefaultCamelContext;
import org.apache.camel.support.ResourceHelper;
import org.apache.camel.support.PluginHelper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import org.xml.sax.InputSource;

@Slf4j
@Service
public class CamelDslValidatorService {

    public void validate(String xmlDsl) {
        checkWellFormedness(xmlDsl);
        checkCamelDsl(xmlDsl);
    }

    private void checkWellFormedness(String xmlDsl) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.newDocumentBuilder().parse(new InputSource(new StringReader(xmlDsl)));
        } catch (SAXParseException e) {
            throw new AtlasException(
                    "XML not well-formed at line %d, column %d: %s".formatted(
                            e.getLineNumber(), e.getColumnNumber(), e.getMessage()),
                    "INVALID_XML", null, HttpStatus.UNPROCESSABLE_ENTITY);
        } catch (SAXException e) {
            throw new AtlasException("XML parsing error: " + e.getMessage(),
                    "INVALID_XML", null, HttpStatus.UNPROCESSABLE_ENTITY);
        } catch (Exception e) {
            throw new AtlasException("XML parsing failed: " + e.getMessage(),
                    "INVALID_XML", null, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private void checkCamelDsl(String xmlDsl) {
        DefaultCamelContext ctx = new DefaultCamelContext();
        ctx.disableJMX();
        try {
            var resource = ResourceHelper.fromString("memory:validate.xml", xmlDsl);
            PluginHelper.getRoutesLoader(ctx).loadRoutes(resource);
            log.debug("Camel DSL validation passed");
        } catch (Exception e) {
            String message = rootCauseMessage(e);
            log.warn("Camel DSL validation failed: {}", message);
            throw new AtlasException("Invalid Camel XML DSL: " + message,
                    "INVALID_DSL", null, HttpStatus.UNPROCESSABLE_ENTITY);
        } finally {
            try { ctx.close(); } catch (Exception ignored) {}
        }
    }

    private String rootCauseMessage(Throwable e) {
        Throwable cause = e;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : e.getMessage();
    }
}
