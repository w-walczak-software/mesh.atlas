package pl.com.ww.mesh.atlas.global.domain.exception;

public class AtlasModificationException extends AtlasException {

    public AtlasModificationException(String message, String tittle, Exception e) {
        super(message, tittle, e);
    }

    public AtlasModificationException(String message, Exception e) {
        super(message, e);
    }

    public AtlasModificationException(Exception e) {
        super(e);
    }

    public AtlasModificationException(String tittle) {
        super(tittle, tittle);
    }

    public AtlasModificationException(Exception e, String tittle) {
        super(e, tittle);
    }
}
