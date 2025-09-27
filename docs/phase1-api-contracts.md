# Phase 1 API and Event Contracts

## 1. Overview
- Scope: REST API endpoints, event streams, and permission considerations for the fintuningAi web platform.
- Audience: frontend engineers, backend engineers, QA, and ops teams implementing Phase 1.
- Conventions: JSON over HTTPS, camelCase payloads, HTTP status codes per RFC 9110, timestamps in ISO 8601 UTC.

## 2. Authentication & Authorization
- Auth scheme: JWT Bearer tokens issued on login; refresh tokens stored HttpOnly; HTTPS required.
- Roles: admin, moderator, user, guest (guest = public read-only, no job execution).

### 2.1 Session Endpoints
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/login | Basic (email + password) | Returns access and refresh tokens plus role, profile, preferred locale. |
| POST | /auth/refresh | Refresh token | Rotates the token pair and invalidates the previous refresh token. |
| POST | /auth/logout | Access token | Revokes refresh token and closes the active session. |
| POST | /auth/impersonate | Admin | Allows an admin to impersonate another user (audited). |

### 2.2 Profile & Hugging Face Token
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /me | Access token | Returns profile, roles, saved presets, Hugging Face token status (present/absent, lastUsedAt). |
| PUT | /me | Access token | Updates displayName, locale, notification preferences. |
| PUT | /me/hf-token | Access token | Stores or updates the encrypted HF token (`token`, optional `label`). |
| DELETE | /me/hf-token | Access token | Deletes the HF token and stops jobs that require private assets. |

### 2.3 API Tokens (default quota 3)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /me/api-tokens | Access token | Lists tokens (id, label, createdAt, lastUsedAt, expiresAt). |
| POST | /me/api-tokens | Access token | Creates a token (label required, optional `expiresAt`) and enforces quota. |
| PATCH | /me/api-tokens/{tokenId} | Access token | Renames or adjusts expiration. |
| DELETE | /me/api-tokens/{tokenId} | Access token | Revokes a token (audited). |
| PATCH | /admin/api-token-quota | Admin | Changes the maximum tokens per user. |

## 3. Hugging Face Catalogue & Dataset APIs

### 3.1 Model Catalogue
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /hf/models | Public (token optional) | Returns cached paginated snapshot with filters `task`, `license`, `framework`, `quantization`, `minParams`, `maxParams`, `search`, `sort`, `page`, `pageSize`. Applies user presets when authenticated. |
| POST | /hf/models/presets | Access token | Saves a preset (`name`, `filters`). Limit 5 presets per user. |
| GET | /hf/models/presets | Access token | Lists presets with `isDefault` flag used during daily sync. |
| DELETE | /hf/models/presets/{presetId} | Access token | Deletes a preset. |

### 3.2 Dataset Search
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /hf/datasets/search | Public (token optional) | Proxy to HF search. Query: `q`, `task`, `language`, `license`, `sizeMin`, `sizeMax`, `sort`. Response marks `locked=true` when private dataset requires token. |
| GET | /hf/datasets/{datasetId} | Access token | Returns metadata (splits, columns, license, lastSyncedAt). Download triggered only with `download=true` when permissions allow. |
| POST | /hf/datasets/presets | Access token | Saves a dataset search preset. |

### 3.3 Admin Sync
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /admin/hf/sync | Admin | Triggers manual catalogue sync (nightly cron by default). Returns `modelsAdded`, `modelsUpdated`, `modelsRemoved`, `durationSec`. |

## 4. Job Management APIs

### 4.1 Job Resources
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /jobs | Access token | Paginated list filterable by status, type, date range. |
| POST | /jobs/fine-tune | Access token (role >= user) | Requires `outputName`, `baseModelId`, `datasetId`, `numExamples`, `maxSteps`, `quantizations[]`, optional `hyperparams`, `notes`. |
| POST | /jobs/dataset-build | Access token (role >= user) | Launches dataset builder (`sourceType`, `config`, `maxExamples`). |
| GET | /jobs/{jobId} | Access token | Detailed information (status, progress, worker, metrics, artifacts, notifications). |
| PATCH | /jobs/{jobId}/pause | Owner/moderator/admin | Pauses job with worker checkpoint. |
| PATCH | /jobs/{jobId}/resume | Owner/moderator/admin | Resumes paused job (requeues if needed). |
| PATCH | /jobs/{jobId}/cancel | Owner/moderator/admin | Cancels job and cleans temporary artifacts. |
| GET | /jobs/{jobId}/events | Access token | Paged event history (progress, warnings, downloads). |
| GET | /jobs/{jobId}/artifacts | Access token | Lists downloadable artifacts (type, size, checksum, signed URL, expiry). |
| GET | /jobs/{jobId}/logs | Access token | Returns recent logs with `sinceEventId` support. |

### 4.2 Notifications
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /notifications/settings | Access token | Email notification preferences (jobComplete, jobFailed, weeklyDigest, locale). |
| PUT | /notifications/settings | Access token | Updates preferences (default jobComplete and jobFailed true). |
| GET | /notifications/history | Access token | Notification audit history. |

## 5. Event Streams
- Transport: WebSocket `/ws` (fallback SSE `/events`).
- Authentication: JWT via `Authorization` header or query `token` during handshake.
- Envelope: `{ "type": string, "timestamp": string, "payload": object }`.

### 5.1 Event Types
| Type | Emitted By | Payload |
| --- | --- | --- |
| job.progress | Backend monitor | `{ jobId, status, progressPct, stage, etaSec?, metrics? }` |
| job.download | Python worker | `{ jobId, resourceType: "model"|"dataset", name, progressPct, bytesDownloaded, totalBytes? }` |
| job.paused | Backend | `{ jobId, reason }` |
| job.cancelled | Backend | `{ jobId, reason }` |
| job.completed | Backend | `{ jobId, success: true, artifacts }` |
| job.failed | Backend | `{ jobId, success: false, errorCode, message }` |
| notification.sent | Backend | `{ notificationId, jobId?, channel, status }` |
| system.alert | Ops | `{ severity, message, link? }` |

Clients subscribe with `{ "type": "subscribe", "jobId": "..." }` and unsubscribe with `{ "type": "unsubscribe", "jobId": "..." }`.

## 6. Permission Matrix

| Capability | Guest | User | Moderator | Admin |
| --- | --- | --- | --- | --- |
| Browse catalogue and public datasets | NO | YES | YES | YES |
| Save presets | NO | YES | YES | YES |
| Store HF token | NO | YES | YES | YES |
| Launch jobs (fine-tune/dataset) | NO | YES | YES | YES |
| Pause own jobs | NO | YES | YES | YES |
| Cancel own jobs | NO | YES | YES | YES |
| Manage other users' jobs | NO | NO | YES (same team/project) | YES |
| Manage own API tokens | NO | YES (max 3) | YES (max 3) | YES (admin limit) |
| Change API token quota | NO | NO | NO | YES |
| Trigger manual HF sync | NO | NO | NO | YES |
| Access dashboards/audits | NO | NO | YES (limited) | YES (full) |
| Manage roles | NO | NO | NO | YES |

## 7. Open Questions
- Email provider (SendGrid, SES, other) and localisation of templates still TBD.
- Final limits for dataset search presets and whether sharing across roles is required.
- Guest access policy for HF proxy (rate limiting, captcha, both?).
- Retention policy for artifacts/logs (auto-expiration vs manual cleanup).
- Definition of "team" for moderator permissions (project-level vs organisation-level).
