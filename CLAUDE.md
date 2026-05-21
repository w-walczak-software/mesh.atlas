# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Project Context

**mesh.atlas** is an enterprise-grade API Registry and Integration Governance Platform — a modern alternative to Backstage with a far stronger focus on governance, auditability, and enterprise architecture intelligence.

The platform acts as:
- API Registry
- Integration Registry
- Event Catalog
- Enterprise Architecture Metadata Hub
- Integration Governance Platform

The platform is **NOT** a CMDB, infrastructure inventory tool, or runtime monitoring platform. Do not model servers, IP addresses, CPU/RAM, Kubernetes runtime details, deployment metrics, or infrastructure patching. Those belong to Prometheus, Grafana, ServiceNow, and cloud providers.

---

# Technology Stack

| Layer | Technology |
|---|---|
| Backend runtime | Java 21, Spring Boot 4.x |
| Persistence | Spring Data JPA, Hibernate, PostgreSQL, Flyway |
| Mapping | MapStruct + Lombok |
| Security | Spring Security OAuth2 Resource Server + Keycloak |
| Frontend | Angular 21, Angular Material, Transloco (i18n) |
| Frontend auth | keycloak-js (PKCE S256) |
| Testing (BE) | H2 in-memory, Spring Boot Test |
| Testing (FE) | vitest |

Architecture: modular monolith → evolutionary DDD, clean architecture, hexagonal where appropriate, metadata-driven.

---

# Development Commands

## Backend

Run from the `backend/` directory (uses `mvnw`):

```bash
# Build
./mvnw clean package

# Run (requires local Keycloak + PostgreSQL — see Infrastructure below)
./mvnw spring-boot:run

# Run with dev profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=MyTestClass

# Run a single test method
./mvnw test -Dtest=MyTestClass#myTestMethod
```

## Frontend

Run from the `frontend/` directory:

```bash
# Install dependencies
npm install

# Dev server (standard, no SSL)
npm start

# Dev server (local HTTPS at https://atlas.ww.local:443 with proxy to backend)
npm run start:local

# Production build
npm run build

# Run tests (vitest)
npm test
```

---

# Local Infrastructure

All services run behind `.ww.local` DNS with self-signed SSL from a local CA.

| Service | URL |
|---|---|
| Backend API | `https://localhost:8888/atlas` |
| Frontend (local dev) | `https://atlas.ww.local:443` |
| Keycloak | `https://keycloak.ww.local:8443` |
| PostgreSQL | `postgresql.ww.local:5432` (db: `atlas`, schema: `atlas`) |

**Keycloak realm**: `atlas` — **client**: `mesh.atlas.web`  
**Roles**: `ATLAS_USER`, `ATLAS_ADMIN` (resolved from both realm_access and resource_access JWT claims)

Backend trusts Keycloak via `classpath:certs/ca.crt`. SSL keystore is `classpath:certs/keystore.p12`.

---

# Backend Architecture

## Package Structure

```
pl.com.ww.mesh.atlas/
├── Application.java
├── dictionary/ #business package
    └── api/ #REST controllers
    └── application/
        └── dto/  #dtos, request response dtos
        └── mapper/  #mapstruct mappers
        └── service/   #services                  
    └── domain/   
        └── model/ #entities
        └── validation/ #validators            
    └── infrastructure/  
        └── persistance/ #jpa repositories    
├── config/           # Spring @Configuration classes
└── global/ #global domain classes, advisors, handlers, exceptions
└── security/
    └── auth/
        ├── AuthenticatedUser.java        # Record: id, email, username, roles
        ├── KeycloakGrantedAuthoritiesConverter.java  # JWT → GrantedAuthority
        ├── UserContextHolder.java        # ThreadLocal holder
        ├── UserContextService.java       # @Service wrapper
        └── preauthorizers/
            ├── AtlasRole.java            # Enum: ATLAS_ADMIN, ATLAS_USER
            ├── IsAtlasAdmin.java         # Meta-annotation
            └── IsAtlasUser.java          # Meta-annotation
```

## Security

**Never use inline `@PreAuthorize`**. Always use the composed meta-annotations:
- `@IsAtlasUser` — allows `ATLAS_USER` or `ATLAS_ADMIN`
- `@IsAtlasAdmin` — allows `ATLAS_ADMIN` only

Inject current user via `UserContextService.getCurrentUser()` which returns `AuthenticatedUser`.

## Database Migrations

Flyway scripts live in `backend/src/main/resources/db/migration/`.  
Naming convention: `V0.XXXX__YYYYMMDD_description.sql` (e.g. `V0.0001__20260520_dictionary_framework.sql`).  
Schema: `atlas`. All tables use UUIDs (`gen_random_uuid()`), explicit constraints, and FK indexes.

## Entity Base Class

All business entities extend `AuditableEntity`, which provides:
- `version` (optimistic lock via `@Version`)
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy` (via Spring Data JPA `@EntityListeners(AuditingEntityListener.class)`)

`JpaAuditingConfig` enables auditing globally. Entities use UUID PKs generated with `@GeneratedValue` and `@UuidGenerator`.

## Exception Hierarchy

```
AtlasException (base, RuntimeException)
├── AtlasDataNotFoundException   → 404
├── AtlasDataFoundException      → 400
├── AtlasDuplicateCodeException  → 409
└── AtlasModificationException   → 400 (e.g., modifying system-defined entries)
```

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps all these to RFC 7807 `ProblemDetail` responses. Always throw the appropriate domain exception from services — never return error DTOs or catch-and-swallow.

## Soft Delete Convention

Business data is never physically deleted. Services expose a `deactivate(UUID id)` method that sets `active = false`. Controllers map this to `DELETE /resource/{id}`. The repository provides filtered queries (`findAllByActive(boolean, Pageable)`).

## MapStruct Update Mapping

Update mappers must `@Mapping(target = "id", ignore = true)`, `@Mapping(target = "code", ignore = true)`, and `@Mapping(target = "systemDefined", ignore = true)` — these fields are immutable after creation.

## Testing

Tests use H2 in-memory (Flyway disabled). Config in `backend/src/test/resources/application.properties`. Add `@SpringBootTest` or `@DataJpaTest` slices as appropriate.

---

# Enterprise Dictionary Framework

**The central extensibility mechanism for all configurable business values.**

Two tables: `dictionary_type` (code must match `^[A-Z][A-Z0-9_]*$`) and `dictionary_entry`.  
Entries support: soft delete (`active`), display ordering, JSONB `metadata`, audit fields (`created_by`, `updated_by`).

### Pre-seeded Dictionary Types

`SYSTEM_STATUS`, `LIFECYCLE_STAGE`, `BUSINESS_CRITICALITY`, `DATA_CLASSIFICATION`, `SYSTEM_TYPE`, `ARCHITECTURE_STYLE`, `API_STYLE`, `AUTHENTICATION_METHOD`, `INTEGRATION_PATTERN`, `PROTOCOL`, `MESSAGE_FORMAT`, `DEPLOYMENT_MODEL`, `RUNTIME_ENVIRONMENT`, `COMPLIANCE`

### Rules

- **NEVER** use `@Enumerated(EnumType.STRING)` for business dictionaries.
- **NEVER** create dedicated tables per dictionary type.
- Business entities reference `DictionaryEntryEntity` via `@ManyToOne`.
- Validate dictionary type correctness on DTO fields with `@DictionaryType(dictionaryCode = "SYSTEM_STATUS")` (custom constraint in `dictionary/domain/validation/`).
- Enums are only for internal technical constants (e.g. `AtlasRole`).
- `metadata` column is JSONB — use for type-specific extended attributes without schema changes.

---

# Frontend Architecture

## Structure

```
frontend/src/app/
├── app.config.ts     # Providers: router, HTTP, animations, Transloco, AUTH init
├── app.routes.ts     # Lazy-loaded routes under Shell
├── core/
│   ├── auth/         # AuthService (keycloak-js signals), authInterceptor (Bearer token), jwt.model.ts
│   └── i18n/         # TranslocoHttpLoader (en/pl JSON assets)
├── shared/
│   ├── auth/         # Shared auth utilities
│   ├── data-table/   # Reusable data table
│   ├── dialogs/      # Reusable dialogs
│   ├── navigation/   # Navigation helpers
│   ├── services/     # Shared services
│   └── toast/        # Toast notifications
├── shell/            # App shell (navbar + sidenav layout)
├── dashboard/        # Implemented feature
├── settings/         # Implemented feature
└── placeholder/      # Stub for: apis, environments, subscriptions, analytics, dictionaries, admin
```

## Angular Patterns

- **Standalone components only** — do NOT set `standalone: true` (it's the default in Angular v20+).
- **Signals** for all state: `signal()`, `computed()`, `input()`, `output()`.
- **Native control flow**: `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`, `*ngSwitch`.
- `ChangeDetectionStrategy.OnPush` on every component.
- `inject()` for DI — not constructor injection.
- No `ngClass` / `ngStyle` — use `class` and `style` bindings.
- All routes are lazy-loaded.
- All dropdowns and select fields must load values from backend dictionary APIs — never hardcoded.

## Auth Flow

`AuthService` initializes Keycloak JS on app boot (`APP_INITIALIZER`), enforces `login-required`, uses PKCE S256. The `authInterceptor` attaches the Bearer token to all API requests. Roles are read from both `realm_access` and `resource_access[clientId]` JWT claims.

## i18n

Transloco handles translations (en/pl). Translations loaded via `TranslocoHttpLoader` from `assets/i18n/{lang}.json`. Language persisted in `localStorage` under key `lang`.

## Shared UI Utilities

- `ToastService` — `success()`, `info()`, `warn()`, `error()` — use for all user-facing feedback; never `alert()` or `console.log()`.
- `DialogService` — `info()`, `error()`, `question()` — use for confirmations and error display.
- `DataTableComponent` — reusable paginated table; use for all list views.

---

# Architectural Principles

### Priorities (in order)
1. Maintainability, Extensibility, Auditability, Traceability
2. Governance, Explicit domain modeling, Strong validation
3. Transactional consistency, Separation of concerns, Backward compatibility

### Audit Requirements
All business entities must have: `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, optimistic locking, revision tracking (Hibernate Envers preferred).

### API Standards
- Versioned URLs, DTOs only (Java records preferred), never expose JPA entities.
- Pagination, filtering, sorting on all collection endpoints.
- Problem Details responses, proper HTTP status codes.
- Thin controllers — business logic in services.

### Domain Focus
Central aggregates: `ITSystem`, `API`, `Integration`. All models must support: impact analysis, dependency graphs, audit trails, historical revisions, governance workflows.

### When Unsure
Choose enterprise-grade design, extensibility, auditability, traceability, and metadata-driven architecture over simplistic implementations.
