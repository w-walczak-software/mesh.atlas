package pl.com.ww.mesh.atlas.global.domain.exception;

public class UserNotFoundException extends AtlasException {

    public UserNotFoundException(String message, String tittle) {
        super(message, tittle);
    }

    public UserNotFoundException(String tittle) {
        super(tittle, tittle);
    }

    public UserNotFoundException(String message, String tittle, Exception e) {
        super(message, tittle, e);
    }

    public UserNotFoundException(String message, Exception e) {
        super(message, e);
    }

    public UserNotFoundException(Exception e) {
        super(e);
    }

    public UserNotFoundException(Exception e, String tittle) {
        super(e, tittle);
    }
}
