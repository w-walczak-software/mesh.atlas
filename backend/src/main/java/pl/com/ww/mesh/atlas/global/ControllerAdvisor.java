package pl.com.ww.mesh.atlas.global;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataFoundException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasDataNotFoundException;
import pl.com.ww.mesh.atlas.global.domain.exception.AtlasException;
import pl.com.ww.mesh.atlas.global.domain.exception.UserNotFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class ControllerAdvisor {
    private static final String MESSAGE = "message";
    private static final String CODE = "code";

    @ExceptionHandler(AtlasDataFoundException.class)
    public ResponseEntity<Object> handleFoundException(AtlasDataFoundException ex, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, ex.getMessage());
        body.put(CODE, ex.getTittle());

        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AtlasDataNotFoundException.class)
    public ResponseEntity<Object> handleNotFoundException(AtlasDataNotFoundException ex, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, ex.getMessage());
        body.put(CODE, ex.getTittle());

        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolationException(DataIntegrityViolationException ex, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, "Nie można usunąć/modyfikować/duplikować danych, które posiadają relację do innych danych.");
        body.put(CODE, "integrity.violation");

        return new ResponseEntity<>(body, HttpStatus.FOUND);
    }

    @ExceptionHandler(AtlasException.class)
    public ResponseEntity<Object> handleDataIntegrityViolationException(AtlasException ex, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, ex.getMessage());
        body.put(CODE, ex.getTittle());

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Object> handleDataIntegrityViolationException(UserNotFoundException ex, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, ex.getMessage());
        body.put(CODE, "user.not.found");

        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }



    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Object> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put(MESSAGE, "Przekroczono maksymalny rozmiar pliku (2MB)");
        body.put(CODE, "max.file.size.exceeded");

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }


}
