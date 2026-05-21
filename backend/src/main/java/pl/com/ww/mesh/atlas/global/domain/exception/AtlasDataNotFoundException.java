package pl.com.ww.mesh.atlas.global.domain.exception;

public class AtlasDataNotFoundException extends AtlasException {

    public AtlasDataNotFoundException(String message, String tittle) {
        super(message, tittle);
    }

    public AtlasDataNotFoundException(String tittle) {
        super(tittle, tittle);
    }

    public AtlasDataNotFoundException(String message, String tittle, Exception e) {
        super(message, tittle, e);
    }

    public AtlasDataNotFoundException(String message, Exception e) {
        super(message, e);
    }

    public AtlasDataNotFoundException(Exception e) {
        super(e);
    }

    public AtlasDataNotFoundException(Exception e, String tittle) {
        super(e, tittle);
    }
}
