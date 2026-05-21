package pl.com.ww.mesh.atlas.global.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
public class GenericResponseDto implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;

        private String code;
        private String message;
}
