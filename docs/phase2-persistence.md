# Phase 2 Persistence Layer Plan

## 1. Objectives
- Stabiliser le schema SQLite pour couvrir utilisateurs, tokens API, projets, datasets (HF/local), jobs, evenements, artefacts.
- Automatiser les migrations et seeds via Drizzle (scripts CLI, integration CI/CD).
- Formaliser les repositories/backends (Fastify) pour interagir avec la base (patterns service + validation shared).
- Preparer la persistence des acces Hugging Face (tokens chiffrés, caches synchronises).

## 2. Deliverables
- drizzle.config.ts + directives de migration (
pm run db:generate, 
pm run db:migrate).
- Schemas Drizzle alignes avec shared/ (types TypeScript). docs/phase2-schema.png (optionnel) pour la vue d'ensemble.
- Scripts de seed : utilisateur admin, tokens demo, jobs exemples, datasets/modele mocks.
- Tests unitaires/integration sur les repositories (utilisation de sqlite in-memory).

## 3. Open Points
- Chiffrement des tokens HF (libs a valider) et stockage du sel.
- Strategie de purge artefacts/logs (cron vs manual operations).
- Gestion multi-organisation/projet (Phase 3?).
