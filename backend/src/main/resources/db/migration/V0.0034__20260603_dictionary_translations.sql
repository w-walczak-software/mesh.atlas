-- Dictionary Entry Translations: multi-language names and descriptions for dictionary entries.
-- Backend reads DEFAULT_LANGUAGE system parameter and serves translated name/description.
-- Fallback: original name/description on dictionary_entry if no translation exists for active language.

CREATE TABLE atlas.dictionary_entry_translation
(
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    version     BIGINT       NOT NULL DEFAULT 0,
    entry_id    UUID         NOT NULL,
    lang_code   VARCHAR(10)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    created_by  VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    CONSTRAINT uq_dictionary_entry_translation     UNIQUE (entry_id, lang_code),
    CONSTRAINT fk_dictionary_entry_translation_entry FOREIGN KEY (entry_id) REFERENCES atlas.dictionary_entry (id),
    CONSTRAINT chk_dict_translation_lang_code      CHECK (lang_code ~ '^[a-z]{2,10}$')
);

CREATE INDEX idx_dict_translation_entry_id ON atlas.dictionary_entry_translation (entry_id);

-- Envers audit table
CREATE TABLE aud.dictionary_entry_translation_aud
(
    id          UUID         NOT NULL,
    rev         BIGINT       NOT NULL,
    revtype     SMALLINT     NOT NULL,
    version     BIGINT,
    created_at  TIMESTAMP,
    created_by  VARCHAR(100),
    updated_at  TIMESTAMP,
    updated_by  VARCHAR(100),
    entry_id    UUID,
    lang_code   VARCHAR(10),
    name        VARCHAR(200),
    description TEXT,
    CONSTRAINT pk_dict_translation_aud     PRIMARY KEY (id, rev),
    CONSTRAINT fk_dict_translation_aud_rev FOREIGN KEY (rev) REFERENCES aud.revinfo (rev)
);

CREATE INDEX idx_dict_translation_aud_rev ON aud.dictionary_entry_translation_aud (rev);

-- Seed: DEFAULT_LANGUAGE — controls which language is used to display dictionary entry names and descriptions
INSERT INTO atlas.system_parameter (parameter_key, parameter_name, parameter_type, description, category,
                                    string_value, system_defined, created_by)
VALUES ('DEFAULT_LANGUAGE',
        'Default Application Language',
        'STRING',
        'Controls the language used to display dictionary entry names and descriptions. Supported values: pl, en.',
        'LOCALIZATION',
        'pl',
        true,
        'system');
