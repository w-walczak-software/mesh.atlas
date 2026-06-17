# Konfiguracja potoku synchronizacji — Apache Camel XML DSL

## Jak działa potok

1. Admin tworzy **Źródło danych** (połączenie JDBC do zewnętrznej bazy).
2. Admin tworzy **Potok** (pipeline) wskazując źródło i encję docelową (`IT_SYSTEM`, `API` lub `DATA_DOMAIN`).
3. Admin wgrywa plik XML z definicją trasy Camel (DSL).
4. Opcjonalnie — definiuje **Mapowania słowników** (zewnętrzna wartość → wpis słownika Atlas).
5. Po ustawieniu statusu potoku na **ACTIVE** — uruchamia synchronizację przyciskiem „Synchronizuj".
6. Silnik (izolowany `DefaultCamelContext`) wykonuje XML DSL, zapisując wiersze do tabel stagingowych.
7. Dane staging są automatycznie promowane do tabel biznesowych (IT System, API, Domena Danych).
8. Wynik każdego uruchomienia widoczny w **Rejestrze synchronizacji**.

---

## Dostępne beany w SimpleRegistry

| Nazwa beana              | Typ                  | Opis                                               |
|--------------------------|----------------------|----------------------------------------------------|
| `sourceDataSource`       | `javax.sql.DataSource` | Połączenie do zewnętrznej bazy (hasło odszyfrowane) |
| `targetDataSource`       | `javax.sql.DataSource` | Główna baza Atlas (schemat `atlas`)                |
| `camelDictionaryMapper`  | `CamelDictionaryMapper` | Tłumaczenie zewnętrznych wartości na UUID wpisów  |
| `pipelineId`             | `String` (UUID)      | ID bieżącego potoku                                |
| `syncRegistryId`         | `String` (UUID)      | ID bieżącego uruchomienia synchronizacji           |

---

## Tabele stagingowe

Dane z zewnętrznej bazy trafiają najpierw do tabel stagingowych (schemat `atlas`):

| Tabela                    | Encja docelowa | Kluczowe kolumny                                                       |
|---------------------------|----------------|------------------------------------------------------------------------|
| `staging_it_system`       | `IT_SYSTEM`    | `external_id`, `code`, `name`, `raw_system_type`, `raw_lifecycle_stage`, `raw_business_criticality`, `description`, `tags` |
| `staging_api`             | `API`          | `external_id`, `code`, `name`, `raw_api_type`, `raw_status`, `description`, `api_version` |
| `staging_data_domain`     | `DATA_DOMAIN`  | `code`, `name`, `raw_group`, `description`, `tags`                     |

Każda tabela stagingowa zawiera też: `pipeline_id`, `staging_status` (`PENDING`), `error_message`, `processed_at`, `created_at`.

> **Uwaga:** Kolumna `external_id` jest kluczem dopasowania dla IT System i API — musi być unikalna w ramach systemu źródłowego. Dla Domeny Danych dopasowanie odbywa się po `code`.

---

## Szablon XML DSL — IT System

```xml
<routes xmlns="http://camel.apache.org/schema/spring">
  <route id="sync-it-systems">
    <from uri="timer:startup?repeatCount=1&amp;delay=0"/>

    <!-- Pobierz dane ze źródła zewnętrznego -->
    <setBody>
      <constant>
        SELECT id, name, system_type, lifecycle, criticality, description
        FROM source_schema.systems
        WHERE active = 1
      </constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <!-- Dla każdego wiersza wstaw do tabeli stagingowej -->
    <split>
      <simple>${body}</simple>
      <to uri="sql:INSERT INTO atlas.staging_it_system
                 (pipeline_id, external_id, code, name,
                  raw_system_type, raw_lifecycle_stage, raw_business_criticality,
                  description, staging_status)
               VALUES
                 (:?pipelineId, :?${body[id]}, :?${body[id]}, :?${body[name]},
                  :?${body[system_type]}, :?${body[lifecycle]}, :?${body[criticality]},
                  :?${body[description]}, 'PENDING')
               ?dataSource=#targetDataSource"/>
    </split>
  </route>
</routes>
```

---

## Szablon XML DSL — API

```xml
<routes xmlns="http://camel.apache.org/schema/spring">
  <route id="sync-apis">
    <from uri="timer:startup?repeatCount=1&amp;delay=0"/>

    <setBody>
      <constant>
        SELECT id, name, api_type, status, version, description
        FROM source_schema.apis
      </constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <split>
      <simple>${body}</simple>
      <to uri="sql:INSERT INTO atlas.staging_api
                 (pipeline_id, external_id, code, name,
                  raw_api_type, raw_status, api_version,
                  description, staging_status)
               VALUES
                 (:?pipelineId, :?${body[id]}, :?${body[id]}, :?${body[name]},
                  :?${body[api_type]}, :?${body[status]}, :?${body[version]},
                  :?${body[description]}, 'PENDING')
               ?dataSource=#targetDataSource"/>
    </split>
  </route>
</routes>
```

---

## Szablon XML DSL — Domena Danych

```xml
<routes xmlns="http://camel.apache.org/schema/spring">
  <route id="sync-data-domains">
    <from uri="timer:startup?repeatCount=1&amp;delay=0"/>

    <setBody>
      <constant>
        SELECT domain_code, domain_name, group_code, description
        FROM source_schema.data_domains
      </constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <split>
      <simple>${body}</simple>
      <to uri="sql:INSERT INTO atlas.staging_data_domain
                 (pipeline_id, code, name, raw_group, description, staging_status)
               VALUES
                 (:?pipelineId, :?${body[domain_code]}, :?${body[domain_name]},
                  :?${body[group_code]}, :?${body[description]}, 'PENDING')
               ?dataSource=#targetDataSource"/>
    </split>
  </route>
</routes>
```

---

## Mapowania słowników

Jeśli zewnętrzna baza przechowuje wartości słownikowe jako stringi (np. `"WEB_APP"`, `"PROD"`), a Atlas używa własnych wpisów słownikowych, należy zdefiniować mapowania w zakładce **Mapowania słowników** w formularzu potoku.

| Typ słownika Atlas      | Przykładowa wartość zewnętrzna | Wpis Atlas (przykład)  |
|-------------------------|-------------------------------|------------------------|
| `SYSTEM_TYPE`           | `WEB_APP`                     | Aplikacja webowa       |
| `LIFECYCLE_STAGE`       | `PROD`                        | Produkcja              |
| `BUSINESS_CRITICALITY`  | `HIGH`                        | Wysoka                 |
| `API_STYLE`             | `REST`                        | REST                   |

Silnik synchronizacji automatycznie rozwiązuje te mapowania podczas promocji danych ze stagingu do tabel biznesowych. **Brak mapowania** powoduje ustawienie pola na `null` (nie blokuje synchronizacji).

---

## Użycie CamelDictionaryMapper w DSL (zaawansowane)

Bean `camelDictionaryMapper` dostępny jest do ręcznego tłumaczenia wartości bezpośrednio w DSL:

```xml
<bean ref="camelDictionaryMapper"
      method="translateValue('SYSTEM_TYPE', ${body[system_type]})"/>
```

Zwraca `String` (UUID wpisu Atlas) lub `null` jeśli mapowanie nie istnieje.

---

## Obsługa błędów

- Błąd w trakcie wykonania Camel XML DSL → cały sync run otrzymuje status `FAILED`.
- Błąd przy promocji konkretnego wiersza (np. brak wymaganego pola) → wiersz dostaje `staging_status = ERROR`, pozostałe wiersze są kontynuowane.
- Wyniki widoczne w Rejestrze synchronizacji → zakładka „Pozycje synchronizacji".

---

---

## Synchronizacja właścicieli biznesowych systemów IT

Potok `IT_SYSTEM` może opcjonalnie synchronizować właścicieli biznesowych (`it_system_owner`). Właściciele są powiązani z systemem przez pole `system_external_id`, które musi odpowiadać `external_id` w tabeli `staging_it_system`.

### Tabela stagingowa `staging_it_system_owner`

| Kolumna             | Typ          | Opis                                                                 |
|---------------------|--------------|----------------------------------------------------------------------|
| `pipeline_id`       | UUID         | ID potoku (FK)                                                       |
| `system_external_id`| VARCHAR(255) | **Wymagane** — musi odpowiadać `external_id` synchronizowanego systemu |
| `external_id`       | VARCHAR(255) | Opcjonalny identyfikator zewnętrzny właściciela                      |
| `first_name`        | VARCHAR(100) | Imię                                                                 |
| `last_name`         | VARCHAR(100) | Nazwisko                                                             |
| `email`             | VARCHAR(200) | Adres e-mail                                                         |
| `raw_role`          | VARCHAR(500) | Zewnętrzna wartość roli — mapowana na słownik `SYSTEM_OWNER_ROLE`    |
| `valid_from`        | DATE         | Data początku ważności (domyślnie: bieżąca data przy promocji)       |
| `valid_to`          | DATE         | Data końca ważności (opcjonalna)                                     |

### Strategia synchronizacji: REPLACE

Gdy podczas promocji systemu w tabeli `staging_it_system_owner` istnieją wiersze dla danego `system_external_id`:
1. **Wszyscy istniejący właściciele systemu są usuwani.**
2. Nowi właściciele są zapisywani ze stagingu.

Jeśli brak wierszy stagingowych dla systemu — istniejący właściciele pozostają bez zmian.

### Mapowanie słownika SYSTEM_OWNER_ROLE

Wartość `raw_role` jest tłumaczona na wpis słownika `SYSTEM_OWNER_ROLE` podczas promocji. Istnieją dwa sposoby:

**Sposób 1 — tłumaczenie przez mapowania potoku (zalecane):**  
W zakładce **Mapowania słowników** należy zdefiniować mapowania dla typu `SYSTEM_OWNER_ROLE`. Kliknięcie „Inicjuj" tworzy wpisy dla wszystkich aktywnych ról. Następnie należy uzupełnić pole „wartość zewnętrzna" dla każdej roli.

Po stronie DSL: wartość zewnętrzna jest wstawiana bezpośrednio jako `raw_role`. Silnik podczas promocji rozwiązuje ją przez tabelę mapowań.

**Sposób 2 — bezpośredni kod Atlas:**  
Jeśli `raw_role` zawiera już kod Atlas (`BUSINESS_OWNER`, `TECHNICAL_OWNER` itd.), mapowanie nie jest wymagane — silnik szuka wpisu bezpośrednio po kodzie.

### Tryb automatyczny i ręczny

Parametr `SYNC_AUTO_PROMOTE` steruje obydwoma typami stagingu:

| Tryb | Zachowanie |
|------|-----------|
| `SYNC_AUTO_PROMOTE = true` | Właściciele promowani automatycznie razem z systemem |
| `SYNC_AUTO_PROMOTE = false` | System + właściciele trafiają do PENDING_REVIEW. Po zaakceptowaniu systemu — właściciele są promowani. Po odrzuceniu systemu — właściciele otrzymują `staging_status = SKIPPED` |

Wiersze właścicieli **nie mają osobnego kroku accept/reject** — zawsze podążają za decyzją dotyczącą systemu nadrzędnego.

### Szablon XML DSL — IT System z właścicielami

Potok zawiera dwie trasy Camel: jedną dla systemów, drugą dla właścicieli. Obie muszą używać `timer` z `repeatCount=1`.

```xml
<routes xmlns="http://camel.apache.org/schema/spring">

  <!-- Trasa 1: systemy IT -->
  <route id="sync-it-systems">
    <from uri="timer:startup?repeatCount=1&amp;delay=0"/>

    <setBody>
      <constant>
        SELECT id, name, system_type, lifecycle, criticality, description
        FROM source_schema.systems
        WHERE active = 1
      </constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <setHeader name="pipelineId">
      <simple>${ref:pipelineId}</simple>
    </setHeader>

    <split>
      <simple>${body}</simple>
      <to uri="sql:INSERT INTO atlas.staging_it_system
                 (pipeline_id, external_id, code, name,
                  raw_system_type, raw_lifecycle_stage, raw_business_criticality,
                  description, staging_status)
               VALUES
                 (:#pipelineId, :#${body[id]}, :#${body[id]}, :#${body[name]},
                  :#${body[system_type]}, :#${body[lifecycle]}, :#${body[criticality]},
                  :#${body[description]}, 'PENDING')"/>
    </split>
  </route>

  <!-- Trasa 2: właściciele biznesowi -->
  <route id="sync-it-system-owners">
    <from uri="timer:owners?repeatCount=1&amp;delay=500"/>

    <setBody>
      <constant>
        SELECT sys_id, owner_fname, owner_lname, owner_email, owner_role
        FROM source_schema.system_owners
        WHERE active = 1
      </constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <setHeader name="pipelineId">
      <simple>${ref:pipelineId}</simple>
    </setHeader>

    <split>
      <simple>${body}</simple>
      <to uri="sql:INSERT INTO atlas.staging_it_system_owner
                 (pipeline_id, system_external_id,
                  first_name, last_name, email, raw_role)
               VALUES
                 (:#pipelineId, :#${body[sys_id]},
                  :#${body[owner_fname]}, :#${body[owner_lname]},
                  :#${body[owner_email]}, :#${body[owner_role]})"/>
    </split>
  </route>

</routes>
```

> **Uwaga:** Trasa właścicieli używa `delay=500` aby mieć pewność, że uruchamia się po trasie systemów — choć obie są niezależne i kolejność w tabeli stagingowej nie ma znaczenia. Ważne jest, że `system_external_id` musi odpowiadać `external_id` wstawionemu przez trasę systemów.

### Mapowanie roli przez DSL (zaawansowane)

Jeśli wartość roli z systemu zewnętrznego powinna być przetłumaczona bezpośrednio w DSL (przed zapisem do stagingu), można użyć beana `camelDictionaryMapper`:

```xml
<setBody>
  <simple>${camelDictionaryMapper.translateValue('SYSTEM_OWNER_ROLE', ${body[owner_role]})}</simple>
</setBody>
```

Wynik (kod Atlas lub `null`) można następnie wstawić jako `raw_role`.

---

## Ograniczenia i uwagi

- Potok musi mieć status **ACTIVE** żeby uruchomić synchronizację.
- Nie można uruchomić dwóch synchronizacji jednocześnie dla tego samego potoku.
- Przed każdym uruchomieniem staging jest czyszczony (`DELETE` wszystkich wierszy dla `pipeline_id`).
- Timeout trasy Camel: **30 minut**. Trasy muszą używać `timer:startup?repeatCount=1` — potok kończy się sam po jednej iteracji.
- Pole `source` na zsynchronizowanych rekordach (IT System, API, Domena Danych) jest ustawiane automatycznie na `code` potoku i **nie można go edytować z GUI**.
- Hasło do źródła danych jest szyfrowane (AES-256/GCM) — nigdy nie jest widoczne w API ani w GUI.
