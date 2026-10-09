# BabyLoading

Phase 1 of the project described in [`PROJECT.md`](PROJECT.md): log journal, cycle and fertility-treatment
entries, see them on a timeline, and track a journey through trying → treatment → pregnancy → postpartum.

## Prerequisites
- Docker Desktop
- .NET SDK 8 (LTS)
- Node.js 20+

## Run it locally

**1. Start local Azure substitutes**
```bash
docker compose up -d
```
This starts the Cosmos DB Emulator (`localhost:8081`) and Azurite (not yet used until Phase 4).

The Cosmos DB Emulator uses a self-signed HTTPS certificate. The API and seed script connect to it over
plain HTTP-wrapped-in-TLS using the emulator's well-known fixed account key (public, documented by
Microsoft — the same for every local emulator instance, not a secret). If you hit a certificate error,
trust the emulator's certificate per
[Microsoft's emulator docs](https://learn.microsoft.com/azure/cosmos-db/emulator).

**2. Run the API**
```bash
cd api/BabyLoading.Api
dotnet run
```
Swagger UI opens at the printed URL (e.g. `http://localhost:5248/swagger`). The `BabyLoading`
database and `entries` container are auto-created against the emulator on first request (DI
resolves them lazily), not at startup — the app starts fine even if the emulator isn't ready yet,
but the first API call will fail if it still isn't reachable by then.

**3. Seed fake demo data**
```bash
cd seed/BabyLoading.Seed
dotnet run
```
Seeds a fake journey for a single demo user: two tracked cycles, an IVF treatment course
(stimulation → trigger → retrieval → transfer → beta hCG), and 40 weekly pregnancy journal entries.
Safe to re-run — it clears the demo user's existing data first.

**4. Run the web app**
```bash
cd web
npm install
cp .env.example .env   # defaults to http://localhost:5248, matching the API's http profile
npm run dev
```
Open the printed local URL (typically `http://localhost:5173`).

## Tests
```bash
cd api
dotnet test
```

## Data model
One Cosmos DB container (`entries`), partitioned by `/userId`, holds every entry type
(`JournalEntry`, `CycleEntry`, `TreatmentEntry`, `Journey`) distinguished by a `type` discriminator.
One container keeps a single change-feed processor (Phase 2) able to pick up every entry type.

- **Consistency level:** Session (the Cosmos DB default) — appropriate here since every read in
  Phase 1 is scoped to the single user who just wrote the data; no cross-user or cross-region reads
  exist yet that would need a stronger guarantee.
- **Indexing policy:** excludes `JournalEntry.text` (the long free-text field) from the index, since
  it's never queried or filtered on directly — only ever read back whole or (from Phase 2 onward)
  searched via its vector embedding.

## Auth
There's no real auth yet. `ICurrentUserService` (implemented by `FakeCurrentUserService`) stands in
for a signed-in user and will be replaced by Entra External ID in Phase 5 without touching any
controller code.

## Known limitations (expected at this phase)
- Not yet verified end-to-end against a running Cosmos DB Emulator in this environment (no Docker
  available here). Verified instead: `dotnet build`/`dotnet test` (13/13 passing), `npm run build`
  (typechecks cleanly), and that the API starts and fails fast with a clear connection error when
  Cosmos isn't reachable — rather than hanging. Please run the steps above locally with Docker to
  confirm the emulator path end-to-end before calling Phase 1 fully done.
- No real authentication.
- `docker-compose.yml` includes Azurite even though nothing uses Blob Storage until Phase 4 — it's
  listed in PROJECT.md's local-environment table from Phase 1 onward, so it's wired up now.
- The Cosmos DB Emulator is memory-hungry and can take a minute or two to become ready after
  `docker compose up`; the API will retry-fail fast if it isn't ready yet — just restart `dotnet run`.
