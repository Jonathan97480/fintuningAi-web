# fintuningAi-web

Modernisation du package de fine-tuning avec interface web Next.js, orchestration Python et gestion Hugging Face.

## Perimetre du projet
- Pilotage de scripts de fine-tuning (`fine_tune_3b.py`, `kilo_dataset_builder.py`) via une interface web React/TypeScript.
- Integration etroite avec Hugging Face pour la gestion des modeles et datasets.
- Stockage des projets, taches et jeux de donnees dans SQLite.

## Ressources cles
- [Roadmap detaillee](ROADMAP.md)
- [Contrats API Phase 1](docs/phase1-api-contracts.md)
- [Sequences critiques Phase 1](docs/phase1-sequences.md)
- Scripts Python : `fine_tune_3b.py`, `kilo_dataset_builder.py`
- Environnements : `setup_env.sh`, `setup_env.bat`, `install_pytorch_gpu.bat`

## Stack prevue
- Frontend : Next.js (React + TypeScript) et SASS, design neon dark, avec Redux Toolkit/RTK Query pour l'etat global.
- Backend : Fastify (Node.js 20) avec BullMQ pour orchestrer les workers Python.
- Base de donnees : SQLite pilotee via Drizzle ORM (migrations dans ops/migrations).
- Support multilingue (i18n) pour l'interface et les notifications.
- Integrations : Hugging Face (HF_TOKEN requis), gestion des jetons API utilisateurs.

## Regles de developpement
- Composants React reutilisables (header, footer, sections, widgets).
- Pas de fonctions dupliquees : factoriser les utilitaires communs.
- Commentaire concis pour chaque fonction ou bloc non trivial.
- Test unitaire obligatoire apres chaque nouvelle fonctionnalite.

## Prochaines etapes
Consulter `ROADMAP.md` pour la sequence complete des phases (decouverte, architecture, persistance, backend, UI, securite, tests et deploiement).

## Structure du depot (WIP)
- frontend/ : Next.js + TypeScript + SASS + Redux Toolkit/RTK Query.
- backend/ : Fastify (TypeScript), BullMQ, Drizzle sur SQLite.
- workers/python/ : scripts de fine-tuning/dataset packages avec Poetry.
- shared/ : schemas Zod, types partages, clients API.
- ops/ : docker-compose, migrations, templates .env.
- artifacts/ : stockage local des datasets, logs, modeles generes (gitignore).




