# Tests Frontend

Ce dossier contient les tests pour l'interface utilisateur (frontend) de l'application fintuningAi-web.

## Installation

```bash
cd frontend
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

### Tests API (`api.test.tsx`)
Tests unitaires pour les appels API utilisant RTK Query :
- ✅ Tests des endpoints health, models, projects, jobs
- ✅ Vérification des mutations (création de projets, jobs)
- ✅ Utilisation de MSW pour mocker les réponses API

### Tests de composants (`home-page.test.tsx`)
Tests d'intégration pour les composants React :
- ✅ Test de rendu de la page d'accueil
- ✅ Vérification du chargement des données API
- ✅ Tests des états de chargement

### Tests d'intégration (`integration.test.tsx`)
Tests end-to-end entre frontend et backend :
- ✅ Serveur backend de test intégré
- ✅ Communication réelle frontend-backend
- ✅ Gestion des erreurs API

## Technologies utilisées

- **Vitest** - Framework de test moderne
- **React Testing Library** - Tests de composants React
- **MSW (Mock Service Worker)** - Mocking des APIs
- **Fastify** - Serveur de test pour l'intégration
- **RTK Query** - Gestion des appels API

## Stratégies de test

### 1. Tests unitaires avec mocks (api.test.tsx)
- Isolation complète des composants
- Utilisation de MSW pour simuler les APIs
- Tests rapides et déterministes

### 2. Tests d'intégration (home-page.test.tsx)
- Test des composants avec leurs dépendances
- Vérification de l'intégration API-composant
- Tests des états de chargement/erreur

### 3. Tests end-to-end (integration.test.tsx)
- Serveur backend réel pour les tests
- Communication complète frontend-backend
- Tests de la logique métier complète

## Variables d'environnement

Pour les tests d'intégration, la variable `NEXT_PUBLIC_API_BASE` peut être configurée pour pointer vers un serveur de test.

## Couverture des tests

Les tests couvrent :

### API Layer ✅
- Tous les endpoints principaux (health, models, projects, jobs)
- Mutations et queries RTK Query
- Gestion des erreurs et états de chargement

### Composants React ✅
- Rendu correct des pages
- Intégration avec les données API
- États de chargement et d'erreur

### Communication Frontend-Backend ✅
- Protocoles HTTP corrects
- Format des données JSON
- Gestion des erreurs réseau