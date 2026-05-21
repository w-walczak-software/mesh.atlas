package pl.com.ww.mesh.atlas.global.domain.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public class AtlasException extends RuntimeException{

    private String key;
    private String context;
    private HttpStatusCode status =  HttpStatus.BAD_REQUEST;

    public AtlasException(String message, String tittle, String context, HttpStatusCode status, Exception e) {
        super(message, e);
        this.key = tittle;
        this.status = status;
        this.context = context;
    }

    public AtlasException(String message, String tittle, String context, HttpStatusCode status) {
        super(message);
        this.key = tittle;
        this.status = status;
        this.context = context;
    }

    public AtlasException(String tittle, String context, HttpStatusCode status) {
        super(tittle);
        this.key = tittle;
        this.status = status;
        this.context = context;
    }

    public AtlasException(String message, String tittle, String context) {
        super(message);
        this.key = tittle;
        this.context = context;
    }

    public AtlasException(String message, Exception e) {
        super(message, e);
    }

    public AtlasException(Exception e) {
        super(e.getMessage(), e);
    }

    public AtlasException(Exception e, String tittle) {
        super(e.getMessage(), e);
        this.key = tittle;
    }
}
