# Backend Tests

Ce dossier contient les tests unitaires pour le backend de fintuningAi-web.

## Structure des tests

```
src/__tests__/
├── jobs.test.ts          # Tests des routes de jobs (POST /jobs/*, GET /jobs)
├── jobQueue.test.ts      # Tests des services de file d'attente BullMQ
├── schemas.test.ts       # Tests des schémas de validation Zod
├── pythonWorkers.test.ts # Tests des workers Python (CLI et processus)
└── setup.ts             # Configuration commune des tests (si nécessaire)
```

## Types de tests

### Tests d'intégration (routes)
- **jobs.test.ts**: Teste les endpoints REST pour la création et récupération des jobs
- Validation des payloads, codes de statut HTTP, format des réponses

### Tests unitaires (services)
- **jobQueue.test.ts**: Teste la configuration des files d'attente BullMQ
- Vérification des options de retry, noms des queues, instances

### Tests de validation (schémas)
- **schemas.test.ts**: Teste les schémas Zod pour la validation des données
- Tests des valeurs valides/invalides, valeurs par défaut

### Tests d'intégration (workers)
- **pythonWorkers.test.ts**: Teste l'intégration avec les workers Python
- Mock des processus enfant, gestion des erreurs

## Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests une fois (CI)
npm run test:run

# Exécuter avec couverture de code
npm run test:coverage
```

## Configuration

Les tests utilisent :
- **Vitest** comme framework de test
- **Fastify inject** pour tester les routes HTTP
- **Vitest mocks** pour mocker les dépendances externes
- **SQLite en mémoire** pour les tests de base de données

## Prérequis pour les tests

1. **Redis**: Doit être en cours d'exécution pour les tests de queue
2. **Base de données**: Tests utilisent SQLite (configuré automatiquement)
3. **Python**: Workers Python testés via mocks (pas d'exécution réelle)

## Écriture de nouveaux tests

### Structure recommandée

```typescript
describe('Component Name', () => {
  describe('Method or Feature', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = { /* test data */ }

      // Act
      const result = await component.method(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Bonnes pratiques

- **Tests isolés**: Chaque test doit être indépendant
- **Mocks appropriés**: Mocker les dépendances externes (Redis, filesystem, etc.)
- **Noms descriptifs**: Décrire clairement ce qui est testé
- **Cas d'erreur**: Tester les chemins d'erreur et les validations
- **Performance**: Tests rapides pour permettre l'exécution fréquente

## Couverture de code

La couverture de code est générée avec `@vitest/coverage-v8` et inclut :
- Statements (déclarations)
- Branches (conditions)
- Functions (fonctions)
- Lines (lignes)

Objectif de couverture : > 80% pour le code critique.