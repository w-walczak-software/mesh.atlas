package pl.com.ww.mesh.atlas.global.domain.exception;

public class AtlasDuplicateCodeException extends AtlasException {

    public AtlasDuplicateCodeException(String message, String tittle, Exception e) {
        super(message, tittle, e);
    }

    public AtlasDuplicateCodeException(String message, Exception e) {
        super(message, e);
    }

    public AtlasDuplicateCodeException(Exception e) {
        super(e);
    }

    public AtlasDuplicateCodeException(String tittle) {
        super(tittle, tittle);
    }

    public AtlasDuplicateCodeException(Exception e, String tittle) {
        super(e, tittle);
    }
}
