# CLAUDE.md

# Project Context

This project is an enterprise-grade API Registry and Integration Governance Platform.

The platform is being built as a modern alternative and competitor to Backstage, with a significantly stronger focus on:

- API governance
- Integration governance
- Auditability
- Traceability
- Enterprise architecture management
- System dependency mapping
- Integration lifecycle
- Contract versioning
- Compliance
- Change accountability
- Impact analysis
- Event cataloging
- Integration lineage

The platform is NOT a CMDB.

The platform must focus on:
- business systems
- APIs
- integrations
- events
- contracts
- ownership
- governance
- architecture metadata

The platform must NOT become infrastructure inventory software.

Do not model:
- servers
- IP addresses
- CPU/RAM
- infrastructure monitoring
- Kubernetes runtime details
- deployment metrics
- infrastructure patching

Those concerns belong to:
- CMDB
- Kubernetes
- Prometheus
- Grafana
- ServiceNow
- cloud providers

---

# Technology Stack

Backend:
- Java 21
- Spring Boot 3
- Spring Data JPA
- Hibernate
- PostgreSQL
- Flyway
- MapStruct
- Maven

Frontend:
- Angular 19
- Angular Material

Architecture:
- Modular monolith initially
- Evolutionary architecture
- Domain-driven design
- Hexagonal architecture where appropriate
- Metadata-driven architecture
- Enterprise integration patterns

---

# General Architectural Principles

All generated code must follow enterprise-grade design principles.

Priorities:
1. Maintainability
2. Extensibility
3. Auditability
4. Traceability
5. Governance
6. Explicit domain modeling
7. Strong validation
8. Transactional consistency
9. Clear separation of concerns
10. Backward compatibility

Avoid simplistic CRUD-only design.

Always think in terms of:
- enterprise metadata
- governance
- lifecycle
- ownership
- compliance
- future extensibility

---

# Domain Principles

The platform manages:
- IT systems
- APIs
- events
- integrations
- contracts
- dependencies
- ownership
- architecture metadata

The central aggregate is usually:
- ITSystem
- API
- Integration

All designs should support:
- impact analysis
- dependency graphs
- audit trails
- historical revisions
- governance workflows
- lifecycle management

---

# Enterprise Dictionary Framework

The application uses a GENERIC DICTIONARY FRAMEWORK.

NEVER generate:
- hardcoded enums for business dictionaries
- dedicated tables for every dictionary
- duplicated CRUD services for dictionaries

Use:
- dictionary_type
- dictionary_entry

Dictionary entries must:
- support metadata
- support audit
- support soft delete
- support localization in future
- support multitenancy in future
- support governance

Dictionary values are stored as entities and referenced using foreign keys.

Use:
- DictionaryEntryEntity
- DictionaryTypeEntity

Business entities must reference dictionary entries using ManyToOne relationships.

Example:
- system status
- business criticality
- architecture style
- deployment model
- integration pattern

must reference DictionaryEntryEntity.

Use validation annotations ensuring dictionary type correctness.

Example:
- @DictionaryType(dictionaryCode = "SYSTEM_STATUS")

DO NOT use:
- @Enumerated(EnumType.STRING)
for business dictionaries.

Enums are allowed ONLY for:
- internal technical constants
- non-configurable framework behavior

---

# Auditability Requirements

Everything important must be auditable.

All business entities must support:
- createdAt
- createdBy
- updatedAt
- updatedBy
- optimistic locking
- revision tracking

Preferred approaches:
- Hibernate Envers
- revision journal tables
- event sourcing where appropriate

The platform must support:
- historical reconstruction
- change accountability
- compliance reporting

Never generate business entities without audit metadata.

---

# Traceability Requirements

The platform must support full traceability between:
- systems
- APIs
- integrations
- events
- contracts
- owners
- environments

Design all models with future graph traversal in mind.

---

# Database Standards

Use PostgreSQL-specific capabilities where beneficial:
- JSONB
- GIN indexes
- full text search
- pg_trgm
- UUID identifiers

Prefer UUIDs over numeric IDs.

All tables should:
- have explicit constraints
- have indexes for lookup fields
- use proper foreign keys
- support future partitioning if applicable

---

# API Design Standards

REST APIs must:
- use versioned URLs
- use DTOs
- never expose JPA entities directly
- support pagination
- support filtering
- support sorting

Use:
- validation annotations
- problem details responses
- proper HTTP status codes

Controllers should remain thin.

Business logic belongs in services/domain layer.

---

# Service Layer Standards

Services must:
- be transactional
- validate domain rules
- enforce governance constraints
- enforce dictionary type correctness

Avoid anemic domain models where possible.

---

# Mapping Standards

Use MapStruct for DTO mapping.

DTOs should use Java records where possible.

Never expose entities directly outside persistence layer.

---

# Repository Standards

Use Spring Data JPA repositories.

Complex queries should use:
- Specifications
- Spring Data JPQL
- dedicated query services

Avoid massive repository interfaces.

---

# Angular Frontend Standards

Frontend should be:
- metadata-driven
- dictionary-driven
- configurable
- enterprise-oriented

Forms should dynamically consume dictionaries from backend APIs.

Avoid hardcoded dropdown values.

---

# Coding Style

Generated code must be:
- production-grade
- explicit
- strongly typed
- readable
- maintainable
- enterprise-oriented

Avoid:
- toy examples
- oversimplified architecture
- magic strings
- hidden assumptions

Always generate:
- validations
- constraints
- indexes
- transactional boundaries
- error handling

---

# Preferred Design Approach

When generating solutions:
- prefer extensibility over shortcuts
- prefer metadata-driven approaches
- prefer governance-friendly solutions
- prefer audit-friendly models
- prefer enterprise integration patterns

Always think about:
- future scale
- future governance
- future integrations
- enterprise operations

---

# What Makes This Platform Better Than Backstage

The platform should aim to provide stronger capabilities than Backstage in:
- integration governance
- dependency tracking
- impact analysis
- auditability
- API lifecycle management
- event governance
- enterprise metadata
- compliance
- change traceability
- integration lineage
- architecture governance

Backstage-like developer portal features are useful, but enterprise governance capabilities are the primary differentiator.

---

# Important Rule

When unsure:
- choose enterprise-grade design
- choose extensibility
- choose auditability
- choose traceability
- choose metadata-driven architecture

Never choose simplistic implementations if enterprise-grade alternatives are appropriate.