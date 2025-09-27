# fintuningAi-web

Modernisation du package de fine-tuning avec interface web Next.js, orchestration Python et gestion Hugging Face.

## Perimetre du projet
- Pilotage de scripts de fine-tuning (`fine_tune_3b.py`, `kilo_dataset_builder.py`) via une interface web React/TypeScript.
- Integration etroite avec Hugging Face pour la gestion des modeles et datasets.
- Stockage des projets, taches et jeux de donnees dans SQLite.

## Ressources cles
- [Roadmap detaillee](ROADMAP.md)
- Scripts Python : `fine_tune_3b.py`, `kilo_dataset_builder.py`
- Environnements : `setup_env.sh`, `setup_env.bat`, `install_pytorch_gpu.bat`

## Stack prevue
- Frontend : Next.js (React + TypeScript) et SASS, design neon dark.
- Backend : API routes Next orchestrant l'execution Python.
- Base de donnees : SQLite (ORM type Prisma/Drizzle a definir).
- Integrations : Hugging Face (HF_TOKEN requis), gestion des jetons API utilisateurs.

## Regles de developpement
- Composants React reutilisables (header, footer, sections, widgets).
- Pas de fonctions dupliquees : factoriser les utilitaires communs.
- Commentaire concis pour chaque fonction ou bloc non trivial.
- Test unitaire obligatoire apres chaque nouvelle fonctionnalite.

## Prochaines etapes
Consulter `ROADMAP.md` pour la sequence complete des phases (decouverte, architecture, persistance, backend, UI, securite, tests et deploiement).
