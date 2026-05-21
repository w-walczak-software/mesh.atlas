package pl.com.ww.mesh.atlas.global.domain.exception;

import lombok.Getter;

@Getter
public class AtlasException extends RuntimeException{

    public String tittle;

    public AtlasException(String message, String tittle, Exception e) {
        super(message, e);
        this.tittle = tittle;
    }

    public AtlasException(String message, String tittle) {
        super(message);
        this.tittle = tittle;
    }

    public AtlasException(String message, Exception e) {
        super(message, e);
    }

    public AtlasException(Exception e) {
        super(e.getMessage(), e);
    }

    public AtlasException(Exception e, String tittle) {
        super(e.getMessage(), e);
        this.tittle = tittle;
    }
}
