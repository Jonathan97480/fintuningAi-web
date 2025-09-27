# Tests pour fintuningAi-web

Ce dossier contient les tests unitaires pour l'application fintuningAi-web utilisant Vitest.

## État actuel des tests

✅ **Tests fonctionnels :**
- Tests de base de données (6 tests) : CRUD complet pour utilisateurs, projets et jobs
- Tests API (1 test) : Route health

⏳ **Tests en attente :**
- Tests des routes jobs (nécessitent mocking des dépendances base de données/services)
- Tests de gestion d'erreurs API

## Installation

```bash
cd test
npm install
```

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests une fois (sans watch mode)
npm run test:run

# Exécuter les tests avec couverture
npm run test:coverage
```

## Structure des tests

- `database.test.ts` - Tests pour les opérations de base de données (utilisateurs, projets, jobs)
- `api.test.ts` - Tests pour les routes API Fastify (actuellement limité à la route health)
- `vitest.config.ts` - Configuration de Vitest
- `package.json` - Dépendances pour les tests
- `.env.test` - Variables d'environnement pour les tests

## Technologies utilisées

- **Vitest** - Framework de test
- **Better SQLite3** - Base de données en mémoire pour les tests
- **Fastify** - Framework API pour les tests d'intégration
- **Drizzle ORM** - ORM pour les opérations de base de données

## Couverture des tests

Les tests couvrent :

### Base de données ✅
- Création, lecture, mise à jour et suppression d'utilisateurs
- Gestion des projets avec clés étrangères
- Opérations CRUD sur les jobs
- Validation des contraintes de base de données

### API (partiel) ✅
- Routes de santé (`/health`) ✅
- Routes de jobs (`/jobs`) ⏳ (en attente de mocking des dépendances)
  - Création de jobs ⏳
  - Récupération de jobs ⏳
  - Liste des jobs ⏳
  - Gestion des événements de jobs ⏳
- Gestion des erreurs et validation des données ⏳