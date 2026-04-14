# AGENTS.md

# Project AI Instructions

This file defines how AI agents should work in this repository.

## Project Goal

Build a prototype of a report platform where a new report can be added quickly, report generation runs asynchronously, and users can request, track, and download report results through a web UI.

This repository is a prototype for a technical assignment, not a production system. Optimize for:

- clarity of architecture
- speed of adding a new report
- explainability during solution defense
- realistic scope for 8-10 hours of implementation

## 1. General Rules

- Do not make assumptions about project structure. If something is unclear, inspect existing code first.
- Prefer minimal, safe changes over large refactors.
- Do not introduce new libraries unless explicitly required or already used in similar parts of the project.
- Keep changes consistent with existing architecture and patterns.
- All chosen libraries and infrastructure tools must have an appropriate license and must be runnable through `docker-compose`.

## 2. Stack

Frontend:

- React
- TypeScript
- React hooks
- functional components only
- state management: Redux Toolkit, Zustand, or Context only when needed, and always follow existing usage in the repo

Backend:

- Node.js
- TypeScript
- Express or NestJS only if aligned with the existing structure
- REST APIs unless GraphQL already exists

For this prototype, agents should keep the stack lightweight and avoid unnecessary framework churn.

## 3. Code Style

- Use TypeScript strictly and avoid `any` unless absolutely necessary.
- Prefer explicit types over inference in public APIs.
- Keep functions small and focused.
- Use early returns instead of deep nesting.
- Avoid magic numbers and strings; extract meaningful constants when needed.

## 4. Frontend Rules

- Always use functional components.
- Do not use class components.
- Keep components small; split them if logic starts dominating the UI.
- Extract reusable logic into hooks where it improves clarity.
- Keep UI components dumb where possible.
- Avoid unnecessary re-renders; use `useMemo` and `useCallback` only when there is a clear benefit.

## 5. Backend Rules

- Controllers must be thin and must not contain business logic.
- Business logic must live in services or report modules.
- Validate all external input.
- Never trust request body data directly.
- Use `async` and `await`; avoid raw promise chains when normal control flow is clearer.

## 6. API Rules

- Follow REST conventions.
- Keep response envelopes consistent.
- Prefer the following JSON response shape:

```ts
{
  success: boolean;
  data?: unknown;
  error?: string;
}
```

- Status endpoints and list endpoints should follow the same envelope shape.
- Download endpoints may return files directly, but error responses should still stay consistent.

## Mandatory Deliverables

The repository must contain and support:

- backend API for:
  - starting report generation
  - checking run status
  - downloading generated result
  - listing available reports
  - listing report runs
- asynchronous report generation
- web UI for working with the platform
- `docker-compose` startup with a single command
- at least 2 reports implemented
- `README.md` with startup instructions
- `ARCHITECTURE.md` with architecture, decisions, extensibility, and tradeoffs

The assignment explicitly requires:

- Backend API for starting report generation, getting status, downloading the result, listing available reports, and listing runs
- asynchronous report generation
- web UI for working with the platform
- `docker-compose` startup with one command
- 2 different reports showing a clear extension pattern

## Scope And Delivery Strategy

Think wide, implement narrow.

For this project, agents should prefer a clean, demo-ready MVP over ambitious infrastructure. If something is out of scope, leave a clear stub or comment and document it in `ARCHITECTURE.md`.

### MVP Architecture

Use a modular monolith split into separate runtime services:

- `web` - user interface
- `api` - HTTP API
- `worker` - background report generation
- `postgres` - metadata and demo data storage

### Explicit Non-Goals For MVP

Do not add these unless explicitly requested:

- authentication and authorization
- websockets or realtime subscriptions
- Redis, Kafka, RabbitMQ, or other external queue systems
- S3 or MinIO object storage
- cron scheduling
- multi-tenant isolation
- advanced observability stack
- generic report builder UI

## Repository Structure

Current intended package layout:

```text
packages/
  shared/   # shared types, DTOs, helpers, schemas
  reports/  # report registry, report contracts, concrete reports, renderers
  api/      # HTTP API
  worker/   # asynchronous job processing
  web/      # frontend UI
```

Agents should preserve this separation of responsibilities.

## Report Platform Design Rules

### 1. Reports Are Modules, Not Hardcoded Branches

New reports should be added as isolated modules in `packages/reports`, then registered in a central registry.

Target pattern:

- report definition metadata
- input schema
- data fetching logic
- transformation logic
- renderer selection

Avoid spreading report-specific logic across `api` and `worker`.

### 2. API Owns Lifecycle, Worker Owns Execution

`api` should:

- validate request payloads
- create report runs
- expose status and download endpoints
- never perform heavy report generation inline

`worker` should:

- poll or fetch pending runs
- execute report generation
- save output artifact
- update run status

Report generation must stay asynchronous as the primary flow.

### 3. Storage Model For MVP

Use:

- PostgreSQL for report metadata and report runs
- local shared volume for generated files

In production notes, this can later be replaced with a real queue and object storage.

### 4. Keep Two Report Formats Visible

The assignment explicitly mentions current XLSX usage and incoming PDF demand. The prototype should reflect this.

Recommended first two reports:

- one `xlsx` report backed by database or demo data
- one `pdf` report backed by a different source type such as mocked external API data

## Recommended API Surface

Keep the API small and aligned with the assignment.

Preferred endpoints:

- `GET /reports`
- `POST /report-runs`
- `GET /report-runs`
- `GET /report-runs/:id`
- `GET /report-runs/:id/download`

Suggested response envelopes for JSON endpoints:

```ts
{
  success: true,
  data: { ... }
}
```

or

```ts
{
  success: false,
  error: "Human-readable error message"
}
```

## Data Model Guidance

Minimum useful entity for MVP:

`report_runs`

Suggested fields:

- `id`
- `report_key`
- `format`
- `params_json`
- `status`
- `created_at`
- `started_at`
- `finished_at`
- `file_path`
- `file_name`
- `error_message`

Status values should be explicit:

- `queued`
- `running`
- `succeeded`
- `failed`

## UI Guidance

The UI should demonstrate the platform workflow, not act as a design exercise.

Prioritize:

- available reports list
- simple parameter form
- list of launches
- status visibility
- download action when ready

Keep the UX clean and understandable. Avoid investing time in advanced routing, animations, or admin tooling before the main flow works.
The UI is mandatory and should expose the full happy-path flow of the platform.

## Definition Of Done For MVP

The prototype is in a good state when:

1. `docker compose up --build` starts all required services.
2. The UI opens and shows available reports.
3. A user can trigger a report run.
4. The run becomes visible in the runs list.
5. The worker processes it asynchronously.
6. The file can be downloaded after success.
7. Two different reports exist and show the extensibility pattern.
8. `README.md` and `ARCHITECTURE.md` describe how the system works and how to add a new report.

## Engineering Priorities

When making tradeoffs, prefer this order:

1. working end-to-end flow
2. clear extensibility model for adding reports
3. understandable code and architecture
4. lightweight but believable infrastructure
5. polish

## Documentation Requirements

Any substantial implementation should keep `README.md` and `ARCHITECTURE.md` aligned.

`ARCHITECTURE.md` must clearly explain:

- components and boundaries
- data flow
- how to add a new report
- key decisions and alternatives
- what was intentionally not implemented
- what would be added for production

## Change Guidance For Agents

When contributing to this repository:

- do not introduce unnecessary infrastructure
- do not turn the system into microservices
- do not couple report-specific logic directly to route handlers
- do not implement synchronous report generation as the main path
- do keep extension points explicit
- do leave stubs with clear comments if something is intentionally deferred
- do optimize for a convincing demo and defense narrative

## Preferred Narrative For Solution Defense

The solution should be easy to explain in 15 minutes:

- modular monolith for speed of delivery
- separate API and worker runtime for async execution
- report registry for fast addition of new reports
- support for multiple data sources and output formats
- simple infrastructure with clear upgrade path to production
