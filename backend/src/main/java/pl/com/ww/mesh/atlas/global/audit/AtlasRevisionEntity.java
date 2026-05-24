package pl.com.ww.mesh.atlas.global.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

@Entity
@Table(name = "revinfo", schema = "aud")
@RevisionEntity(AtlasRevisionListener.class)
@Getter
@Setter
public class AtlasRevisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @RevisionNumber
    @Column(name = "rev")
    private long rev;

    @RevisionTimestamp
    @Column(name = "rev_tstmp", nullable = false)
    private long revtstmp;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "user_id", length = 36)
    private String userId;
}
