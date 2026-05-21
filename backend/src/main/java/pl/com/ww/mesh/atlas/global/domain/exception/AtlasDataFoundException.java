package pl.com.ww.mesh.atlas.global.domain.exception;

public class AtlasDataFoundException extends AtlasException {

    public AtlasDataFoundException(String message, String tittle, Exception e) {
        super(message, tittle, e);
    }

    public AtlasDataFoundException(String message, Exception e) {
        super(message, e);
    }

    public AtlasDataFoundException(Exception e) {
        super(e);
    }

    public AtlasDataFoundException(Exception e, String tittle) {
        super(e, tittle);
    }
}
