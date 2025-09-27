# Project Roadmap

## Development Guidelines
- Developper le front en composants React reutilisables (header, footer, sections, widgets).
- Interdire les fonctions dupliquees : factoriser les utilitaires communs.
- Documenter chaque fonction ou bloc non trivial avec un commentaire concis pour clarifier son role.
- Apres chaque nouvelle fonctionnalite, ajouter un test unitaire qui verifie le comportement attendu.

## Phase 0 - Discovery and Planning
**Status:** Completed (see docs/phase0-discovery.md).
- Audit existing Python scripts (fine_tune_3b.py, kilo_dataset_builder.py, notebooks) and current Hugging Face usage (models, datasets, required tokens).
- Inventory dependencies from requirements.txt; map runtime needs (GPU, Python version, caching strategy).
- Define measurable goals for the web interface (core flows, performance, monitoring expectations).
- Establish design direction: neon-futuristic dark theme (violet gradients, glow, bold typography) per provided reference.

## Phase 1 - Architecture and Environment
**Status:** In progress (see docs/phase1-architecture.md).
- Split-service layout in place (`frontend/`, `backend/`, `workers/python/`) with shared schemas and BullMQ orchestration scaffolding.
- API contracts + sequence diagrams captured in docs/phase1-api-contracts.md and docs/phase1-sequences.md (auth, HF, jobs, events).
- Hugging Face token strategy recorded (user-provided tokens encrypted, daily sync mock implemented).
- Document key flow sequences (fine-tuning job, daily model refresh, dataset search) for implementation hand-off.
- Scaffold baseline project directories and ops assets (docker-compose, env templates, placeholders).
## Phase 2 - Persistence Layer
- Design SQLite schema: users, API tokens, projects, datasets (Hugging Face references plus local paths), fine-tuning jobs, job events/logs, produced models.
- Choose migration tool or lightweight ORM for TypeScript (for example Prisma or Drizzle) and migration workflow.
- Implement seeding strategy for demo data and default admin user.

## Phase 3 - Backend Foundations
- Scaffold Next.js app with TypeScript, SASS modules, ESLint, Prettier.
- Configure shared utilities (logger, error formatter, env loader, HTTP helpers).
- Implement authentication middleware (Bearer tokens) and token issuance/rotation endpoints.
- Add base CRUD endpoints for projects, datasets, jobs (without Python orchestration yet) with SQLite integration.

## Phase 4 - Python Integration
- Refactor Python scripts into reusable modules callable via CLI or programmatic entry points; ensure structured JSON output and consistent exit codes.
- Implement job runner in Node: queue management, spawning Python, streaming stdout/stderr, capturing metrics/logs in SQLite.
- Handle Hugging Face interactions (model/dataset download/upload, caching) with retry/backoff and token injection.
- Build monitoring hooks (progress updates, cancellation, failure recovery).

## Phase 5 - User Interface
- Establish global styling (theme provider, typography scale, gradients, glow effects) matching design reference.
- Create layout components: navigation bar, sidebar, cards with glassmorphism, responsive grid.
- Implement pages:
  - Dashboard overview (job summaries, recent activity, quick actions).
  - Project detail with job list and dataset links.
  - Job run screen with real-time charts/logs, status timeline.
  - Dataset manager (import from Hugging Face, upload local).
  - User settings for API tokens (create/copy/revoke) and Hugging Face credentials.
- Integrate client-side data fetching (React Query or SWR) with optimistic updates and error states.

## Phase 6 - Security and Observability
- Hash and store API tokens securely; display only once on creation.
- Validate all API inputs (Zod/TypeScript schemas) and sanitize file paths.
- Add rate limiting and basic throttling on sensitive endpoints.
- Instrument logging/metrics (structured logs, job duration metrics, error tracking hooks).

## Phase 7 - Testing and Quality Assurance
- Unit tests: API routes, token auth, SQLite models, Python module wrappers.
- Integration tests: Node <-> Python job execution with mocked Hugging Face.
- End-to-end tests: UI flows (dashboard, launching jobs, token management) with Playwright or Cypress.
- Visual regression snapshots for key pages (ensure neon theme consistency).
- Performance smoke tests for job orchestration and large dataset handling.

## Phase 8 - Deployment and Documentation
- Prepare environment configuration templates (.env.example) covering Hugging Face tokens, DB path, auth secrets.
- Create build scripts (Next.js, Python packaging) and CI pipeline (lint, tests, Docker image if needed).
- Document operational playbooks: adding new models/datasets, rotating tokens, troubleshooting jobs.
- Plan release milestones and future enhancements (multi-user roles, advanced analytics, model registry integration).

