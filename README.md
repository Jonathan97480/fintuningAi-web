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




## Installation rapide\nPour basculer entre SQLite et MariaDB, positionner DB_DIALECT dans vos fichiers .env (sqlite par defaut, mysql pour MariaDB) et renseigner les variables MYSQL_*.
1. Installer les dependances frontend et backend (depuis la racine):
   - `npm install --workspace frontend`
   - `npm install --workspace backend`
   - `npm install --workspace shared`
2. Copier `ops/.env.example` vers un fichier `.env` adapte a chaque service.
3. Lancer le backend: `npm run dev --workspace backend` (necessite Redis en local ou via `docker-compose`).
4. Lancer le frontend: `npm run dev --workspace frontend`.
5. Les workers Python se lancent via Poetry: `cd workers/python && poetry install` puis `poetry run fintuning-worker --help`.

## Docker (aperçu)
Un compose de developpement est disponible dans `ops/docker-compose.yml` avec des Dockerfile dedies pour chaque service.
### Synchronisation du package shared
Avant de lancer le backend, exécuter `npm run build --workspace shared` afin de générer les types partagés consommés par Fastify.

### Workers
- Lancer le consumer BullMQ : 
pm run worker --workspace backend (necessite Redis).


\n## Pages disponibles\n- / : dashboard neon (status API, modeles en avant).\n- /jobs : liste des jobs + suivi live.\n- /jobs/new : creation d'un job fine-tuning via API.\n- /datasets : recherche Hugging Face avec indicateur 🔒.\n- /models : catalogue mock synchronise quotidiennement.\n- /projects : gestion des projets et datasets rattaches.\n

\n## Scenario de test UI\n1. 
pm run db:migrate --workspace backend puis 
pm run db:seed --workspace backend.\n2. 
pm run dev --workspace backend (assure-toi que Redis tourne).\n3. 
pm run dev --workspace frontend.\n4. Ouvre http://localhost:3000, cree un job via /jobs/new, verifie /jobs et le flux temps reel.\n5. Teste /datasets (cherche un terme), /models (filtre par task).\n6. Pour reset, vide rtifacts/fintuning.db et relance les migrations.\n

