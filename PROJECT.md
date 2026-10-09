# BabyLoading — Project Plan

## Goal
A web app where a woman documents her journey to and through pregnancy: cycle tracking, structured fertility-treatment tracking (IUI/IVF), and a week-by-week pregnancy journal with feelings, symptoms and photos, through a short postpartum close-out. AI lets her search her own history in plain language and ask general questions answered from trusted sources.

Portfolio project demonstrating **AI-200: Developing AI Cloud Solutions on Azure** (replacement for AZ-204).

## Constraints
1. **Local first.** Build and test everything locally in Docker. Azure only in Phase 5 (exception: an embedding/chat model from Phase 2).
2. **Fake data only.** Fertility and pregnancy data is special-category health data under GDPR. Demo with generated seed data.
3. **The AI is not a doctor.** No diagnosis or medical advice. Answers only from the curated knowledge base, always with sources. Warning symptoms (bleeding, severe pain, reduced fetal movement) → "contact your midwife / 1177". Cycle predictions are estimates, never contraception.
4. **Handle both endings with care.** A journey can end in a failed treatment, a pregnancy loss, or a live birth. Loss: the user can mark this; the app then stops pregnancy-week content, milestones and cheerful prompts. Birth: the app shifts from week-by-number content into a short postpartum phase (see Phase 1) instead of just stopping.
5. **Low cost.** Free tiers and scale-to-zero. Redis, PostgreSQL and Service Bus Standard exist in Azure only during demos.
6. **Config, not code.** No hard-coded endpoints or secrets. Local → Azure must be a configuration change only.

## How to work (for Claude Code)
- Work on **one phase at a time**, in order. Don't start the next phase until the current one meets its "Done when".
- Before each step: show the plan (files to create or change). Build in small steps that can be run and tested.
- Every feature gets tests. A phase is done only when its tests pass.
- Tick the checkbox in this file when a task is done, then suggest a commit (per the Git rules in CLAUDE.md).
- Don't add services, libraries or features not listed here without asking.

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), responsive, English UI |
| API | ASP.NET Core Web API, .NET current LTS |
| AI worker | Python |
| Journal data + vectors | Cosmos DB for NoSQL, partition key `/userId` |
| Knowledge base + RAG | PostgreSQL + pgvector |
| Cache + semantic cache | Azure Managed Redis |
| Messaging | Service Bus |
| Events | Event Grid |
| Serverless | Azure Functions |
| Files | Blob Storage |
| AI models | Azure OpenAI (embeddings + small chat model) |
| Auth | Entra External ID (local: fake dev user) |
| Config / secrets | App Configuration, Key Vault (local: appsettings + user-secrets) |
| Monitoring | OpenTelemetry → Application Insights, KQL |
| Hosting | Static Web Apps (web), Container Apps + KEDA (API, worker), Container Registry |
| Infra / CI | Bicep, GitHub Actions |
| Tests | xUnit (API), pytest (worker), Vitest (web) |

## Repository structure
```
BabyLoading/
├── web/          React frontend
├── api/          .NET API (incl. change feed processor)
├── worker/       Python AI worker
├── functions/    Azure Functions
├── seed/         Fake demo data generator
├── infra/        Bicep (core + demo-only)
├── k8s/          Optional AKS manifests (local Kubernetes)
├── docker-compose.yml
├── CLAUDE.md
└── PROJECT.md
```

## Local environment
Add each service to `docker-compose.yml` only in the phase that needs it.

| Azure service | Local substitute | From phase |
|---|---|---|
| Cosmos DB | Cosmos DB Emulator | 1 |
| Blob Storage | Azurite | 1 |
| Service Bus | Service Bus Emulator | 2 |
| PostgreSQL | `pgvector/pgvector` image | 3 |
| Redis | `redis/redis-stack` image | 3 |
| Functions | Azure Functions Core Tools | 4 |
| Event Grid | HTTP test events to the Function | 4 |
| Key Vault / App Configuration | user-secrets / appsettings | 1 |
| Azure OpenAI | Azure OpenAI, or a local model for testing only | 2 |

Embeddings from different models are incompatible. Local-model embeddings are test data and must be regenerated after switching to Azure OpenAI.

---

## Phase 1 — Core app
**Goal:** log entries and cycle data, see them on a timeline.

- [ ] `docker-compose.yml`: Cosmos DB Emulator, Azurite
- [ ] Data model: `JournalEntry` (date, text, mood 1–5, symptoms: {name, severity 1–5}[], phase, pregnancyWeek?), `CycleEntry` (date, type: period / LH test / temperature, value), `TreatmentEntry` (date, cycleDay, medication, dose, time?, clinicVisit?, scanResults? (follicle count, lining), betaHcgResult?), `Journey` (phase: trying / treatment / pregnant / postpartum / ended, startDate, outcome?: birth / loss / stopped)
- [ ] API: CRUD for journal, cycle and treatment entries; journey phase changes, including ending a journey or moving pregnant → postpartum on `outcome: birth`
- [ ] Fertile-window estimate from period history + positive LH tests (documented as an estimate)
- [ ] Gestational-age calculation with the correct reference point per conception path: LMP for natural conception and IUI (IUI approximates natural ovulation timing); fixed transfer-date offset for IVF (e.g. day-5 transfer: due date = transfer date + 261 days; day-3: +263 days)
- [ ] Postpartum phase is time-boxed (~6–8 weeks) with its own short, low-key content (recovery check-ins, not week-by-week baby content); after the window she can mark the journey `ended` or keep journaling with no phase-specific content
- [ ] Cosmos DB: partition key `/userId`, custom indexing policy (exclude long text fields), chosen consistency level documented in README
- [ ] Fake dev user behind an auth interface (replaced by Entra External ID in Phase 5)
- [ ] Web: create entry, timeline, cycle calendar
- [ ] Seed script: realistic fake journey (trying → IVF → pregnancy weeks 1–40)
- [ ] Tests: API endpoints, fertile-window logic
- [ ] README: how to run locally

**Done when:** `docker compose up` + API + web run, seed data loads, journal/cycle/treatment entries appear on the timeline, tests pass.

## Phase 2 — "Ask my journey"
**Goal:** plain-language search of her own journal ("When did I last feel nausea this bad?").

- [ ] **First:** check whether the Cosmos DB Emulator supports vector search. If not, use a Cosmos DB free-tier account for this phase.
- [ ] Add Service Bus Emulator
- [ ] Change feed processor (.NET background service in the API): new/updated entry → Service Bus queue. Covers every entry type (journal, cycle, treatment, and later appointment) — not just `JournalEntry` — so "ask my journey" can answer treatment/appointment questions too
- [ ] Python worker: queue → embedding → vector stored on the Cosmos DB item
- [ ] Dead-letter handling: failed messages retried, then dead-lettered and logged
- [ ] Cosmos DB vector index + vector similarity search, filtered by `userId`
- [ ] Embedding provider behind an interface (local model ↔ Azure OpenAI)
- [ ] API endpoint + UI: "Ask my journey"
- [ ] Tests: pipeline end to end with a test message; search returns expected entries for seeded data

**Done when:** a new entry is embedded automatically and a plain-language question returns the right past entries.

## Phase 3 — Knowledge assistant (RAG)
**Goal:** general questions ("What happens in week 12?") answered only from trusted sources, with citations.

- [ ] Curate a small knowledge base. **Check each source's terms of use before storing content.**
- [ ] Add PostgreSQL + pgvector and Redis
- [ ] Ingestion script: chunk → embed → store with metadata (week, topic, source URL)
- [ ] pgvector index (HNSW); vector search with metadata filters; connection pooling
- [ ] RAG endpoint: retrieve → answer with small chat model → citations
- [ ] Guardrails: no diagnosis; warning symptoms → midwife / 1177; "I don't know" when sources don't cover the question
- [ ] Redis: exact-match cache with expiration + invalidation when the knowledge base changes
- [ ] Redis: semantic cache using a vector index (similar questions reuse answers)
- [ ] Test set (~20 questions incl. medical-advice and emergency cases) run automatically

**Done when:** the test set passes: answers cite sources, refuse diagnosis, handle warning symptoms.

## Phase 4 — Reminders, photos, summaries
- [ ] Medication reminders: Service Bus scheduled messages → in-app notifications (stored in Cosmos DB; no email/SMS)
- [ ] Appointment tracking: `AppointmentEntry` (date, type: ultrasound / bloodwork / checkup / scan, notes, nextAppointmentDate?); reuse the medication-reminder mechanism above for appointment reminders rather than a second pipeline
- [ ] Kick counter: movement-counting session (start/stop, count, duration) stored as a Cosmos DB entry. The Constraint #3 reduced-movement warning is a **static note always shown on the counter screen**, never triggered by a count threshold — the app doesn't decide for her what counts as concerning
- [ ] Photo upload to Blob Storage
- [ ] Function: blob-created event → thumbnail (locally triggered over HTTP)
- [ ] Event Grid custom events for milestones (e.g. week 20), with filters and retry policy; suppressed for ended journeys
- [ ] Weekly AI summary of her entries (Python worker)
- [ ] Export the journey as a PDF "memory book"

## Phase 5 — Azure deployment
- [ ] **Budget alert** ($20/month) before creating anything
- [ ] Bicep, Sweden Central: `core` template (always on) + `demo` template (Redis, PostgreSQL, Service Bus Standard; deploy for demos, then delete)
- [ ] Container Registry; images built with ACR Tasks
- [ ] Container Apps: API + worker; KEDA scales the worker on queue length; scale to zero; revision management
- [ ] Static Web Apps for the frontend
- [ ] Entra External ID replaces the fake dev user
- [ ] Managed identity everywhere; Key Vault with secret rotation; App Configuration with an AI-assistant feature flag
- [ ] OpenTelemetry tracing: web → API → Service Bus → worker
- [ ] KQL queries / workbook: requests, failures, queue processing time
- [ ] GitHub Actions: test, build, deploy
- [ ] README: architecture diagram, AI-200 mapping, cost notes, privacy design, demo video

## Optional — AKS practice (free)
- [ ] Kubernetes manifests in `k8s/` for API and worker, run on Docker Desktop's built-in Kubernetes. Covers the AKS exam skills without paying for a cluster.

## AI-200 skill mapping
| AI-200 skill | Where |
|---|---|
| Container Registry, ACR Tasks | Phase 5 |
| Container Apps, revisions, KEDA | Phase 5 |
| AKS manifests, troubleshooting | Optional |
| Cosmos DB SDK, indexing, consistency, RUs | Phase 1 |
| Cosmos DB vectors, change feed | Phase 2 |
| PostgreSQL, pgvector, RAG, pooling | Phase 3 |
| Redis caching + vector index | Phase 3 |
| Service Bus queues, scheduled messages, dead-letter | Phases 2, 4 |
| Event Grid custom events, filters, retries | Phase 4 |
| Azure Functions triggers + bindings | Phase 4 |
| Key Vault, App Configuration | Phase 5 |
| OpenTelemetry, KQL | Phase 5 |

## Out of scope
Native mobile app · real users or real health data · medical advice · email/SMS notifications · paid AKS cluster · partner accounts · full newborn/baby-care tracking (feeding, sleep, growth — postpartum phase is for *her* recovery journaling only) · algorithmic risk alerts of any kind (e.g. kick-count thresholds, symptom-severity scoring — the app surfaces her own data and static guidance text; it never decides on her behalf that something is medically concerning)