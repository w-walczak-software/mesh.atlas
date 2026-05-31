# mesh.atlas — Roadmap komercyjny

> Dokument opisuje planowane funkcjonalności i ulepszenia niezbędne, aby mesh.atlas stał się
> komercyjnym rozwiązaniem klasy enterprise i uzyskał przewagę rynkową nad Backstage, SwaggerHub,
> Apigee, Kong Konnect i MuleSoft Anypoint.
>
> Priorytety: **[P1]** krytyczne dla MVP komercyjnego · **[P2]** przewaga rynkowa · **[P3]** długoterminowe

---

## 1. Wieloformatowy rejestr API — tooling per-protokół

Obecna wersja umożliwia rejestrowanie API dowolnego typu (REST, SOAP, GraphQL, gRPC, AsyncAPI,
WebSocket, EDI, Batch File i inne) poprzez słownik `API_TYPE`, a format kontraktu opisuje słownik
`CONTRACT_TYPE` (OpenAPI 3, AsyncAPI, Protobuf, WSDL, GraphQL SDL itd.). Brakuje jednak narzędzi
specyficznych dla poszczególnych formatów: importerów specyfikacji, dedykowanych przeglądarek
dokumentacji oraz rozszerzonych metadanych per-protokół.

- **[P1]** **Importer AsyncAPI 3.x** — auto-parsowanie specyfikacji AsyncAPI i wypełnianie
  metadanych: kanały, bindings, producenci/konsumenci, typy zdarzeń (Kafka, RabbitMQ, AMQP, NATS)
- **[P1]** **Importer gRPC (.proto)** — import pliku `.proto`, generowanie dokumentacji serwisów
  i metod, wersjonowanie
- **[P2]** **Importer GraphQL** — import schematów SDL, przeglądarka typów i mutacji
- **[P2]** **Przeglądarka WSDL** — parsowanie WSDL i widok operacji/portów
  *(WSDL parser w toku — `wsdl-parser.ts`)*
- **[P2]** **Rozszerzone metadane per-protokół** — model JSONB z polami specyficznymi dla każdego
  typu API (kanały AsyncAPI, serwisy gRPC, typy GraphQL) bez zmiany schematu dla każdego nowego formatu
- **[P3]** **Webhooks** jako pierwszoklasowe obiekty rejestru

---

## 2. Import / Export i integracje z narzędziami projektowania

Kluczowe dla adopcji — deweloperzy nie będą ręcznie wpisywać metadanych.

- **[P1]** Import **OpenAPI 3.x / Swagger 2.0** (JSON i YAML) — tworzenie lub aktualizacja wpisu API
- **[P1]** Import **AsyncAPI 3.x** — jak wyżej
- **[P1]** Eksport do **OpenAPI** — generowanie specyfikacji na podstawie metadanych
- **[P2]** Import z **Postman Collection v2**
- **[P2]** Import z **Insomnia**
- **[P2]** Dwukierunkowa synchronizacja z **SwaggerHub** (push/pull)
- **[P2]** Webhook do odbioru zdarzeń z **GitHub / GitLab** (push nowej specyfikacji → auto-import)
- **[P3]** Plugin do **IntelliJ IDEA** i **VS Code** — publikacja API bezpośrednio z IDE

---

## 3. API Governance — przepływy zatwierdzania i polityki

To jest główna przewaga nad Backstage i SwaggerHub — governance jako first-class citizen.

- **[P1]** **Lifecycle workflow**: szkic → przegląd → zatwierdzenie → aktywny → deprecacja → wycofanie
  - stany z konfigurowalnymi przejściami
  - wymagane role do zatwierdzenia każdego przejścia
  - powiadomienia e-mail i in-app przy zmianie stanu
- **[P1]** **Polityki API** — konfigurowalne reguły walidacji:
  - wymagane pola (np. właściciel, SLA tier, producent)
  - dozwolone protokoły i metody uwierzytelniania per domena
  - minimalny poziom dokumentacji
  - automatyczna ocena zgodności przy zapisie
- **[P2]** **Change Request workflow** — propozycja zmiany, przegląd, zatwierdzenie, wdrożenie
- **[P2]** **Approval gates w CI/CD** — REST endpoint zwracający wynik walidacji polityk dla danego API;
  pipeline może blokować deploy jeśli API nie spełnia polityk
- **[P2]** **Compliance dashboard** — procent API zgodnych z politykami, raporty per domena / per system
- **[P3]** Konfigurowalny **scoring jakości API** (API Maturity Score) — ocena punktowa wg zdefiniowanych kryteriów

---

## 4. Analiza wpływu i inteligencja architektoniczna

Unikalny obszar — żadne z głównych rozwiązań nie oferuje tego na tym poziomie.

- **[P1]** **Blast radius analysis** — dla danego API/systemu: które systemy konsumenckie zostaną dotknięte
  zmianą, ile API zależy od tego producenta, głębokość zależności
- **[P1]** **Deprecation impact report** — przy oznaczeniu API jako deprecated: lista konsumentów z kontaktami
  do właścicieli, sugerowany harmonogram migracji
- **[P2]** **Breaking change detection** — porównanie dwóch wersji specyfikacji OpenAPI/AsyncAPI,
  automatyczne oznaczenie jako breaking i blokada zmiany stanu bez dokumentacji migracji
- **[P2]** **Dependency graph export** — eksport grafu zależności do formatów: JSON, CSV, Mermaid, PlantUML
- **[P2]** **Circular dependency detection** — wykrywanie cykli w grafie integracji z alertem
- **[P3]** **What-if analysis** — symulacja: co się stanie jeśli wyłączymy system X?

---

## 5. Developer Portal — samoobsługowe centrum dla konsumentów API

Backstage jest tu silny — mesh.atlas musi oferować porównywalny lub lepszy DX.

- **[P1]** **Publiczny/wewnętrzny portal API** — przeglądanie katalogu bez logowania (konfigurowalny)
- **[P1]** **Interaktywna dokumentacja** — Swagger UI / Redoc zintegrowany z wpisem API,
  renderowanie specyfikacji OpenAPI zapisanej w rejestrze
- **[P2]** **Subskrypcje API** — konsument może złożyć wniosek o dostęp do API z workflow zatwierdzenia
- **[P2]** **Zarządzanie kluczami API** (opcjonalnie delegowane do gateway'a) — widok kluczy, rotacja, odwołanie
- **[P2]** **Środowisko sandbox** — możliwość wywoływania API testowego bezpośrednio z portalu
- **[P2]** **Powiadomienia dla konsumentów** — subskrypcja zmian: nowa wersja, deprecacja, zmiana SLA
- **[P3]** **Oceny i komentarze API** — feedback od konsumentów widoczny dla właścicieli

---

## 6. Zaawansowane zarządzanie wersjami i deprecacja

- **[P1]** **Wersjonowanie API** jako first-class feature:
  - wiele aktywnych wersji jednocześnie
  - powiązanie wersji z konkretną specyfikacją
  - historia wersji z datami i autorami
- **[P1]** **Formalna deprecacja** — data sunset, komunikat migracyjny, link do nowej wersji
- **[P2]** **Sunset countdown** — widoczny licznik dni do wycofania w portalu i na liście
- **[P2]** **Automatyczne powiadomienia** do konsumentów przy zbliżającej się dacie sunset
- **[P2]** **Changelog** — historia zmian API z możliwością opisania co się zmieniło w każdej wersji

---

## 7. CI/CD i DevOps Integration

- **[P1]** **REST API do zarządzania rejestrem** — pełny CRUD przez API (istniejące), +
  endpoint do publikacji specyfikacji z pipeline'u
- **[P1]** **GitHub Actions** — gotowa akcja do publikacji/aktualizacji API w rejestrze
- **[P2]** **GitLab CI component** — odpowiednik dla GitLab
- **[P2]** **Lint hook** — walidacja specyfikacji OpenAPI/AsyncAPI przed importem (spectral lub własny)
- **[P2]** **Webhook outbound** — mesh.atlas wywołuje webhook przy zmianie stanu API
  (np. do uruchamiania pipeline'ów regeneracji SDK lub dokumentacji)
- **[P3]** **Terraform provider** — zarządzanie wpisami rejestru jako infrastrukturą

---

## 8. Analytics i raportowanie

- **[P1]** **Dashboard executive** — KPI: liczba API per status/typ, zgodność z politykami,
  pokrycie dokumentacji, API bez właściciela
- **[P1]** **Raporty na żądanie** — eksport do CSV/XLSX: pełny katalog API, lista konsumentów,
  API bez SLA, API bez właściciela
- **[P2]** **Trend charts** — wzrost liczby API w czasie, zmiany statusów, nowe integracje
- **[P2]** **Governance health score** — zagregowana ocena dojrzałości governance per domena/system
- **[P2]** **Scheduled reports** — cykliczne wysyłanie raportów e-mail do menedżerów
- **[P3]** Integracja z **Grafana** — datasource plugin do budowania własnych dashboardów z danych mesh.atlas

---

## 9. Zaawansowane RBAC i multi-tenancy

- **[P1]** **Uprawnienia per zasób** — właściciel API może edytować tylko swoje API,
  admin domeny zarządza domeną, atlas_admin zarządza wszystkim
- **[P1]** **Teams / Organizacje** — grupowanie użytkowników w zespoły, przypisanie zespołu do systemu/domeny
- **[P2]** **Self-service onboarding** — rejestracja systemu przez właściciela z workflow zatwierdzenia
- **[P2]** **Delegowane administrowanie domeną** — Domain Owner może zarządzać słownikami i politykami
  w zakresie swojej domeny
- **[P3]** **Multi-tenant SaaS** — izolacja danych per tenant, billing, plany subskrypcji

---

## 10. Powiadomienia i alerty

- **[P1]** **In-app notifications** — centrum powiadomień w UI (ikona dzwonka)
- **[P1]** **E-mail notifications** — szablony dla: zmiana stanu API, deprecacja, wniosek o dostęp,
  przypisanie jako właściciel
- **[P2]** **Slack / MS Teams integration** — powiadomienia na kanał przy zdarzeniach rejestru
- **[P2]** **SLA breach alert** — gdy zadeklarowane parametry SLA nie są spełniane (dane z integracji z APM)
- **[P3]** **PagerDuty / OpsGenie integration** — eskalacja krytycznych alertów governance

---

## 11. AI / Intelligent Features

Przewaga na kolejne 2–3 lata. Żaden z głównych konkurentów nie ma tego natywnie.

- **[P2]** **Semantic search** — wyszukiwanie API po znaczeniu, nie tylko po słowach kluczowych
  (embeddingi + vector store)
- **[P2]** **Auto-generowanie opisów** — na podstawie specyfikacji OpenAPI sugeruj opis API, domenę,
  tagi (LLM call z podglądem przed zapisem)
- **[P2]** **AI-assisted impact analysis** — natural language query: "co się stanie jeśli zmienię
  odpowiedź endpointu /orders/{id}?"
- **[P3]** **API recommendations** — "konsumenci systemu X często korzystają też z API Y"
- **[P3]** **Anomaly detection** — wykrywanie niespójności: API bez konsumentów od 12 miesięcy,
  zduplikowane funkcjonalności między domenami

---

## 12. Bezpieczeństwo i zgodność

- **[P1]** **API Security Posture** — ocena konfiguracji bezpieczeństwa: brak auth, niebezpieczny protokół,
  brak polityki bezpieczeństwa → oznaczenie jako ryzyko
- **[P1]** **Data Classification enforcement** — API z klasyfikacją CONFIDENTIAL/SECRET wymaga
  dodatkowych pól (polityka bezpieczeństwa, metoda auth) — walidacja przy zapisie
- **[P2]** **Secret scanning w specyfikacjach** — wykrywanie kluczy API, tokenów, haseł w importowanych
  dokumentach OpenAPI
- **[P2]** **Compliance presets** — gotowe pakiety polityk zgodności: GDPR, ISO 27001, PCI-DSS
- **[P2]** **Pełny audit log** — każda operacja na każdym obiekcie zapisana z userem, timestampem, różnicą
- **[P3]** **Certyfikaty bezpieczeństwa API** — formalna ścieżka certyfikacji API jako "security reviewed"

---

## 13. Ulepszenia UX / UI

- **[P1]** **Onboarding wizard** — kreator pierwszego API, systemu IT i domeny dla nowych użytkowników
- **[P1]** **Global search** (Cmd+K) — wyszukiwanie po całym katalogu: API, systemy, domeny, słowniki
- **[P2]** **Favoriting** — oznaczanie API/systemów jako ulubione, personalizowany dashboard
- **[P2]** **Recently viewed** — historia ostatnio przeglądanych obiektów
- **[P2]** **Bulk operations** — masowa zmiana statusu, przypisanie domeny, tagowanie wielu API naraz
- **[P2]** **Dark mode**
- **[P3]** **Keyboard navigation** — pełna obsługa klawiatury bez myszy (accessibility)
- **[P3]** **Mobile-responsive** — responsywny layout dla tabletów

---

## 14. Integracje z ekosystemem enterprise

- **[P2]** **Jira integration** — tworzenie ticketów bezpośrednio z widoku API (deprecation task,
  security issue, change request)
- **[P2]** **Confluence integration** — eksport dokumentacji API jako strona Confluence
- **[P2]** **ServiceNow integration** — synchronizacja CI (Configuration Items) z systemami IT w rejestrze
- **[P2]** **API Gateway sync** (Apigee, Kong, AWS API GW) — import API ze zdefiniowanych gateway'ów
- **[P3]** **LDAP/AD group sync** — automatyczne przypisanie ról z grup Active Directory
- **[P3]** **ArgoCD / Flux integration** — śledzenie wersji API wdrożonych na środowiskach

---

## 15. Infrastruktura i operacje (SaaS readiness)

- **[P1]** **Docker Compose** dla lokalnego startu całego stacku (backend + frontend + Keycloak + PG)
- **[P1]** **Helm chart** dla Kubernetes
- **[P2]** **Health check endpoints** — `/actuator/health` z detalicznym statusem zależności
- **[P2]** **Metryki Prometheus** — eksponowanie metryk aplikacyjnych
- **[P2]** **Horizontal scaling** — bezstanowy backend, session w Redis
- **[P3]** **SaaS offering** — managed cloud version, tenant provisioning, billing integration

---

## Priorytety na MVP komercyjny (P1 skompresowane)

| # | Funkcjonalność | Szacunek |
|---|---|---|
| 1 | Import OpenAPI 3.x + renderowanie dokumentacji | 5d |
| 2 | Lifecycle workflow z powiadomieniami | 8d |
| 3 | Polityki API + compliance dashboard | 10d |
| 4 | Blast radius analysis (rozszerzenie grafu) | 5d |
| 5 | Wersjonowanie API + deprecation + sunset | 6d |
| 6 | Uprawnienia per zasób (właściciel API) | 5d |
| 7 | In-app + e-mail notifications | 6d |
| 8 | Dashboard executive + eksport CSV | 4d |
| 9 | API Security Posture score | 4d |
| 10 | Global search (Cmd+K) | 3d |
| 11 | Docker Compose + Helm chart | 3d |
| **Razem** | | **~59d** |
