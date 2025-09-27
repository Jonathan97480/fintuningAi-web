# Phase 1 Sequence Walkthroughs

Format: text-based sequence tables listing actors and ordered steps. Components used: Frontend (FE), Backend API (BE), Job Queue (Queue), Python Worker (Worker), SQLite DB (DB), Redis Cache (Redis), Email Service (Email).

## 1. Fine-Tuning Job Lifecycle
| Step | Actor | Action |
| --- | --- | --- |
| 1 | User (FE) | Submits job form with outputName, baseModelId, datasetId, numExamples, maxSteps, quantizations. |
| 2 | FE | Sends POST /jobs/fine-tune to BE with JWT. |
| 3 | BE | Validates payload, verifies role >= user, checks quotas. |
| 4 | BE -> DB | Inserts job record (status=pending) + parameters. |
| 5 | BE -> Queue | Enqueues job with jobId and payload. |
| 6 | BE -> FE | Returns 202 with jobId. |
| 7 | Worker (via Queue) | Dequeues task, fetches HF token (user or service) from BE/DB. |
| 8 | Worker -> HF | Downloads model if missing; emits job.download events to BE via WebSocket webhook. |
| 9 | Worker -> HF | Streams dataset (unless download flag true) and reports download progress. |
| 10 | Worker | Launches fine-tuning script, emitting job.progress events. |
| 11 | Worker -> DB | Writes event/log batches via BE ingestion endpoint. |
| 12 | Worker | On success, stores artifacts under artifacts/ and registers metadata via BE. |
| 13 | Worker -> Queue | Signals completion; BE updates job status to completed and records metrics. |
| 14 | BE -> Email | Sends completion notification if enabled. |
| 15 | FE | Receives real-time updates via WebSocket; job dashboard refreshes. |

## 2. Daily Model Catalogue Sync
| Step | Actor | Action |
| --- | --- | --- |
| 1 | Cron (Queue) | Schedules sync job nightly or manual trigger via admin endpoint. |
| 2 | BE | Enqueues sync job with service HF token context. |
| 3 | Worker | Calls HF API search with filters (compatibility criteria). |
| 4 | Worker -> DB | Upserts model entries, marking added/updated/removed. |
| 5 | Worker -> Redis | Invalidates cache buckets for /hf/models. |
| 6 | Worker -> BE | Emits summary event; BE stores audit trail. |
| 7 | BE -> Email | Optionally notifies admins if anomalies detected. |

## 3. Dataset Search Flow
| Step | Actor | Action |
| --- | --- | --- |
| 1 | User (FE) | Opens dataset search page; FE loads saved presets. |
| 2 | FE -> BE | Calls GET /hf/datasets/search with query and filters. |
| 3 | BE -> Redis | Checks cache for identical query; if miss, forwards to HF. |
| 4 | BE -> HF | Performs search using user HF token if present, else service read-only token. |
| 5 | HF -> BE | Returns results; BE flags entries requiring token access (locked). |
| 6 | BE -> Redis | Stores response with TTL; records search history in DB. |
| 7 | BE -> FE | Returns results list, lock indicators, dataset metadata snippet. |
| 8 | FE | Displays results; locked items show padlock + CTA to provide HF token/request access. |
