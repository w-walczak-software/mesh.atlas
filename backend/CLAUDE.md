# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Full project context, architecture, and patterns are in the root `CLAUDE.md`. This file covers backend-specific rules only.

---

# Stack

Java 21, Spring Boot 4.0.6, Spring Data JPA, Hibernate, PostgreSQL, Flyway, MapStruct + Lombok, Spring Security OAuth2 Resource Server.

# Hard Rules

- Never expose JPA entities directly from controllers — always map to DTOs (Java records preferred).
- Never use field injection (`@Autowired` on fields) — use constructor injection (via `@RequiredArgsConstructor`).
- Never use `@Enumerated(EnumType.STRING)` for business dictionaries — use the Enterprise Dictionary Framework.
- Never write anemic services — business logic lives in services, not controllers or entities.
- Never use inline `@PreAuthorize` — use `@IsAtlasUser` / `@IsAtlasAdmin` meta-annotations only.

# pom.xml: Annotation Processor Order

The `maven-compiler-plugin` annotation processor path order must be:
1. `lombok`
2. `lombok-mapstruct-binding`
3. `mapstruct-processor`
4. `hibernate-jpamodelgen`

Do NOT add per-execution `<annotationProcessorPaths>` blocks — they override the top-level config and will silently drop processors (MapStruct learned this the hard way).
