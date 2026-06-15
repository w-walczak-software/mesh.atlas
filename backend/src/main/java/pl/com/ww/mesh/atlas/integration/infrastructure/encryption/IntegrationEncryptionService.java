package pl.com.ww.mesh.atlas.integration.infrastructure.encryption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class IntegrationEncryptionService {

    private final String encryptionKey;

    public IntegrationEncryptionService(
            @Value("${atlas.integration.encryption-key}") String encryptionKey) {
        this.encryptionKey = encryptionKey;
    }

    public String encrypt(String plaintext, UUID salt) {
        return encryptor(salt).encrypt(plaintext);
    }

    public String decrypt(String ciphertext, UUID salt) {
        return encryptor(salt).decrypt(ciphertext);
    }

    private TextEncryptor encryptor(UUID salt) {
        String saltHex = salt.toString().replace("-", "").substring(0, 16);
        return Encryptors.delux(encryptionKey, saltHex);
    }
}
