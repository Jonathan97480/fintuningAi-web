# Phase 1 API and Event Contracts

## 1. Overview
- Scope: REST API endpoints, event streams, and permission considerations for the fintuningAi web platform.
- Audience: frontend engineers, backend engineers, QA, and ops teams implementing Phase 1.
- Conventions: JSON over HTTPS, camelCase payloads, HTTP status codes per RFC 9110, timestamps in ISO 8601 UTC.

## 2. Authentication & Authorization
- **Auth scheme**: JWT Bearer tokens issued on login; refresh tokens stockés HttpOnly; HTTPS obligatoire.
- **Roles**: admin, moderator, user, guest (guest = lecture seule publique).

### 2.1 Session Endpoints
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /auth/login | Basic (email + password) | Retourne access/refresh tokens + rôle, profil, langue préférée. |
| POST | /auth/refresh | Refresh token | Fait tourner le couple access/refresh et invalide l'ancien refresh. |
| POST | /auth/logout | Access token | Révoque le refresh, clôt la session active. |
| POST | /auth/impersonate | Admin | Permet à un admin d'endosser un autre utilisateur (audit obligatoire). |

### 2.2 Profil & Gestion HF token
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /me | Access token | Profil, rôles, presets, statut du HF token (présent/absent, dernière utilisation). |
| PUT | /me | Access token | Met à jour displayName, locale, préférences de notifications. |
| PUT | /me/hf-token | Access token | Stocke/met à jour le HF token chiffré (`token`, `label` optionnel). |
| DELETE | /me/hf-token | Access token | Supprime le token HF et stoppe les jobs nécessitant des accès privés. |

### 2.3 Tokens API (quota par défaut 3)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /me/api-tokens | Access token | Liste (id, label, createdAt, lastUsedAt, expiresAt). |
| POST | /me/api-tokens | Access token | Crée un token (label requis, `expiresAt` optionnel) et vérifie le quota. |
| PATCH | /me/api-tokens/{tokenId} | Access token | Renomme ou ajuste l'expiration. |
| DELETE | /me/api-tokens/{tokenId} | Access token | Révoque un token (audit). |
| PATCH | /admin/api-token-quota | Admin | Modifie la limite par utilisateur. |

## 3. Hugging Face Catalogue & Dataset APIs

### 3.1 Catalogue de modèles
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /hf/models | Public (token optionnel) | Snapshot paginé avec filtres `task`, `license`, `framework`, `quantization`, `minParams`, `maxParams`, `search`, `sort`, `page`, `pageSize`. Applique presets utilisateur si connecté. |
| POST | /hf/models/presets | Access token | Sauvegarde un preset (`name`, `filters`). Limite 5 par utilisateur. |
| GET | /hf/models/presets | Access token | Liste des presets avec flag `isDefault`. |
| DELETE | /hf/models/presets/{presetId} | Access token | Supprime un preset. |

### 3.2 Recherche datasets
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /hf/datasets/search | Public (token optionnel) | Proxy HF. Query: `q`, `task`, `language`, `license`, `sizeMin`, `sizeMax`, `sort`. Ajoute `locked=true` si dataset privé sans token. |
| GET | /hf/datasets/{datasetId} | Access token | Détails (splits, colonnes, licence, lastSyncedAt). Téléchargement via `download=true` si autorisations. |
| POST | /hf/datasets/presets | Access token | Enregistre un preset de recherche dataset. |

### 3.3 Synchro admin
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /admin/hf/sync | Admin | Déclenche la synchro manuelle (cron nocturne). Retour : `modelsAdded`, `modelsUpdated`, `modelsRemoved`, `durationSec`. |

## 4. Job Management APIs

### 4.1 Ressources jobs
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /jobs | Access token | Liste paginée filtrable par statut/type/date. |
| POST | /jobs/fine-tune | Access token (≥ user) | `outputName`, `baseModelId`, `datasetId`, `numExamples`, `maxSteps`, `quantizations[]`, `hyperparams?`, `notes?`. |
| POST | /jobs/dataset-build | Access token (≥ user) | Génère un dataset (`sourceType`, `config`, `maxExamples`). |
| GET | /jobs/{jobId} | Access token | Détails complets (statut, progrès, worker, métriques, artefacts). |
| PATCH | /jobs/{jobId}/pause | Owner/mod/admin | Pause avec checkpoint. |
| PATCH | /jobs/{jobId}/resume | Owner/mod/admin | Reprise du job. |
| PATCH | /jobs/{jobId}/cancel | Owner/mod/admin | Annule + purge les artefacts temporaires. |
| GET | /jobs/{jobId}/events | Access token | Historique des événements. |
| GET | /jobs/{jobId}/artifacts | Access token | Artefacts téléchargeables (type, taille, checksum, URL signée, expiration). |
| GET | /jobs/{jobId}/logs | Access token | Derniers logs avec `sinceEventId`. |

### 4.2 Notifications
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /notifications/settings | Access token | Préférences email (jobComplete, jobFailed, weeklyDigest, locale). |
| PUT | /notifications/settings | Access token | Met à jour les préférences (par défaut jobComplete + jobFailed). |
| GET | /notifications/history | Access token | Audit des notifications envoyées. |

## 5. Event Streams
- Transport : WebSocket `/ws` (fallback SSE `/events`).
- Auth : JWT via header `Authorization` ou query `token` au handshake.
- Envelope : `{ "type": string, "timestamp": string, "payload": object }`.

### 5.1 Types d'événements
| Type | Émis par | Payload |
| --- | --- | --- |
| job.progress | Backend monitor | `{ jobId, status, progressPct, stage, etaSec?, metrics? }` |
| job.download | Worker Python | `{ jobId, resourceType: "model"\|"dataset", name, progressPct, bytesDownloaded, totalBytes? }` |
| job.paused | Backend | `{ jobId, reason }` |
| job.cancelled | Backend | `{ jobId, reason }` |
| job.completed | Backend | `{ jobId, success: true, artifacts }` |
| job.failed | Backend | `{ jobId, success: false, errorCode, message }` |
| notification.sent | Backend | `{ notificationId, jobId?, channel, status }` |
| system.alert | Ops | `{ severity, message, link? }` |

Client subscribe : `{ "type": "subscribe", "jobId": "..." }`. Unsubscribe : `{ "type": "unsubscribe", "jobId": "..." }`.

## 6. Permission Matrix

| Capability | Guest | User | Moderator | Admin |
| --- | --- | --- | --- | --- |
| Parcourir catalogue & datasets publics | ✅ | ✅ | ✅ | ✅ |
| Sauvegarder des presets | ❌ | ✅ | ✅ | ✅ |
| Stocker un token HF | ❌ | ✅ | ✅ | ✅ |
| Lancer jobs (fine-tune/dataset) | ❌ | ✅ | ✅ | ✅ |
| Pause jobs personnels | ❌ | ✅ | ✅ | ✅ |
| Annuler jobs personnels | ❌ | ✅ | ✅ | ✅ |
| Gérer jobs d'autrui | ❌ | ❌ | ✅ (équipe/projet) | ✅ |
| Gérer ses tokens API | ❌ | ✅ (max 3) | ✅ (max 3) | ✅ (limite admin) |
| Modifier quota tokens | ❌ | ❌ | ❌ | ✅ |
| Synchro HF manuelle | ❌ | ❌ | ❌ | ✅ |
| Dashboards & audits | ❌ | ❌ | ✅ (limité) | ✅ (complet) |
| Gestion des rôles | ❌ | ❌ | ❌ | ✅ |

## 7. Open Questions
- Fournisseur email (SendGrid, SES, autre) et localisation des templates à confirmer.
- Limites exactes pour les presets dataset et partage éventuel entre rôles.
- Politique invité pour le proxy HF : rate limiting / captcha ?
- Politique de rétention artefacts/logs (expiration automatique ?).
- Définition d'une "équipe" pour les droits modérateur (projet vs organisation).
