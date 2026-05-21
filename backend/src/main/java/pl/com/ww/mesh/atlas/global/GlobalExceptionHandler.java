package pl.com.ww.mesh.atlas.global;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataFoundException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataNotFoundException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDuplicateCodeException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasModificationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AtlasDataNotFoundException.class)
    public ProblemDetail handleDictionaryTypeNotFound(AtlasDataNotFoundException ex) {
        var detail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        detail.setTitle(ex.getTittle());
        return detail;
    }

    @ExceptionHandler(AtlasDataFoundException.class)
    public ProblemDetail handleDictionaryEntryNotFound(AtlasDataFoundException ex) {
        var detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        detail.setTitle(ex.getTittle());
        return detail;
    }

    @ExceptionHandler(AtlasDuplicateCodeException.class)
    public ProblemDetail handleDuplicateCode(AtlasDuplicateCodeException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AtlasModificationException.class)
    public ProblemDetail handleSystemDefinedModification(AtlasModificationException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
