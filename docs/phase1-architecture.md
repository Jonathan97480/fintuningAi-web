# Phase 1 Architecture and Environment

## 1. Project Layout (Option 3)
- frontend/: Next.js app (React + TypeScript + SASS) using Redux Toolkit/RTK Query, served separately from the backend.
- backend/: Fastify service (TypeScript) exposing REST endpoints, authentication, job orchestration, and SQLite access.
- workers/python/: Python package providing fine-tuning runners, dataset builders, and Hugging Face utilities.
- shared/: Cross-service contracts (TypeScript types, Zod schemas, OpenAPI spec, logging helpers).
- ops/: Infrastructure assets (docker-compose, CI workflows, env templates, migration scripts).
- artifacts/: Storage mount for generated datasets, trained adapters, logs, and Hugging Face cache snapshots.

## 2. Component Responsibilities
- Frontend: authentication UI, profile management (HF token entry), dashboards, dataset/model catalogues, job monitoring.
- Backend: REST API, token validation, authorization, rate limiting, SQLite persistence, job queue metrics, streaming updates.
- Python workers: run fine-tuning/dataset tasks, emit structured progress logs, manage HF downloads/uploads per job.
- Shared: provide schema validation, DTOs, error taxonomy, API clients usable by frontend and backend.
- Ops: deliver reproducible dev/prod environments, container orchestration, build/test automation.

## 3. Key Flows
### 3.1 Fine-tuning Job Lifecycle
1. Frontend sends authenticated `POST /jobs/fine-tune` with model/dataset IDs, hyperparameters, and options.
2. Backend validates payload (Zod), stores job + parameters in SQLite, enqueues a BullMQ job.
3. Worker consumer dequeues, resolves HF token (user profile fallback to service token), spawns Python runner (`python -m jobs.fine_tune`).
4. Python runner streams progress events (JSON lines) to stdout; backend listener persists them in `job_events` and pushes WebSocket updates.
5. On completion/failure, worker updates job status, persists artifacts metadata (paths in artifacts/), and emits notification to frontend.

### 3.2 Daily Hugging Face Model Catalogue Refresh
1. Scheduled BullMQ cron job calls HF API (search endpoints) with service token.
2. Results normalized into `hf_models` table (name, tags, task, last_seen_at) with diffing to mark new/removed entries.
3. Cache invalidated in Redis; frontend Redux slice refetches catalogue on next access.

### 3.3 Dataset Search Flow
1. User queries via frontend search bar (term + filters).
2. Backend endpoint proxies to Hugging Face dataset search (with user token if provided for private datasets).
3. Responses cached (Redis TTL + SQLite history) and returned to frontend; Redux stores results and metadata.

## 4. Hugging Face Token Lifecycle
- Users save their personal HF token in profile settings; backend encrypts and stores hash + cipher in SQLite.
- Backend fetches decrypted token when scheduling jobs; if absent, uses read-only service token for public assets.
- Tokens never sent to frontend after initial entry; rotation and revocation endpoints invalidate stored copies.
- Audit trails log token usage per job for compliance.

## 5. Tooling Decisions (Final)
- Backend runtime: Node.js 20, Fastify 5, TypeScript, Pino logger, Zod validation.
- Job orchestration: BullMQ + Redis (with fallback in-memory adapter for local dev scenarios).
- Database layer: SQLite + Drizzle ORM, migrations stored under ops/migrations.
- Frontend state: Redux Toolkit + RTK Query, React 18, SASS modules + CSS variables for neon theme.
- Python environment: Python 3.11, Poetry-managed dependencies, entrypoints under workers/python/jobs/.
- Observability: structured JSON logs, Prometheus metrics endpoint on backend, optional Grafana dashboards via docker-compose.

## 6. Environment Setup Outline
- Initialize Next.js app in frontend/ (TypeScript, SASS, ESLint/Prettier, Redux Toolkit template, Jest/Testing Library).
- Scaffold backend/ Fastify project (tsconfig, ESLint, Drizzle config, auth middleware, BullMQ worker bootstrap).
- Create workers/python/ package (pyproject.toml via Poetry, shared utils module, CLI entrypoints for fine-tuning and dataset jobs).
- Add shared/ package (pnpm workspace or turborepo package) for types and validation schemas.
- Prepare ops/ assets: docker-compose (frontend, backend, redis, worker, dev db), Makefile or npm scripts, `.env.example` covering JWT secret, HF_SERVICE_TOKEN, REDIS_URL, DB_PATH.
- Configure artifacts/ as bind mount (ignored by git except for `.gitkeep`).

## 7. Next Actions
- Update ROADMAP Phase 1 tasks to reflect finalized choices.
- Generate sequence diagrams or markdown tables detailing API contracts (WIP).
- Begin scaffolding repositories/directories according to this layout.
## 8. Stakeholder Requirements
- Daily model catalogue sync stores full metadata for all compatible training/quantization models; user-specific filter presets saved in SQLite; models only download on-demand when launching jobs and reuse local cache when available.
- Dataset search exposes task/language/licence/size filters, supports private datasets via user HF token, and displays a lock prompt when token/access is missing; dataset browsing prefers streaming unless the user opts into full download.
- UI must be multi-language (i18n-ready) across front-end views, including notifications/messages.
- Job creation requires output model name, selected model, dataset, number of examples, number of steps, and quantization checkboxes (default FP16 when none selected).
- Jobs can be paused or cancelled; cancellation removes generated artifacts/directories safely.
- Job telemetry streams progress percentage, current stage, and download progress for models/datasets.
- Roles: admin, moderator, user, guest; permissions enforced server-side and in UI.
- API tokens: up to 3 active per user by default, adjustable by admins via admin interface, with labels/expiry management.
- HF tokens remain valid until the user revokes them; backend encrypts at rest and logs usage per job.
- Email notifications on job completion/failure (extensible to future channels).
- Artifacts downloadable from user history and accessible through secure API endpoints.
