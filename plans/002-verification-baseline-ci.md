# Plan 002: Établir une baseline de vérification (typecheck, tests backend exécutables, CI)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- turbo.json package.json apps/backend/package.json apps/backend/jest.config.js apps/backend/tsconfig.json apps/storefront/package.json README.md .github/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-fix-null-category-sitemap-and-links.md (rend `tsc --noEmit` vert côté storefront)
- **Category**: dx
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

Il n'existe **aucune commande unique qui prouve que le repo est vert**, et aucun garde-fou automatisé : pas de CI, aucun script `typecheck`, `turbo lint` ne fait rien (aucun package ne définit `lint`), et `turbo test` saute silencieusement le backend (pas de script `test`, et sa config jest référence un fichier de setup qui n'existe pas). Résultat concret : le bug de sitemap du plan 001 est resté 3 semaines dans `main` alors que `tsc --noEmit` le signalait — rien ne l'exécutait. Ce plan crée le filet : typecheck par app, tests backend exécutables avec un premier test réel, une tâche Turbo agrégée, et un workflow GitHub Actions.

## Current state

- `turbo.json` — tâches `build/dev/start/lint/test/seed` ; pas de `typecheck`. Ligne 6 : `"outputs": ["dist/**", ".next/**"]` — `.next/**` est un reliquat de starter (aucune app Next.js) et la sortie réelle du build backend (`.medusa/`) n'est pas capturée (`apps/backend/tsconfig.json:14` : `"outDir": "./.medusa/server"`) → le cache Turbo du build backend est inopérant.
- `package.json` (racine) — scripts `dev/build/start/lint/test/backend:seed/backend:dev/storefront:dev`. Pas de `typecheck` ni de `check` agrégé.
- `apps/backend/package.json` — scripts : `build/start/dev/seed/seed:bleunuit/test:integration:http/test:integration:modules/test:unit`. **Pas de script `test`** → `turbo test` l'ignore.
- `apps/backend/jest.config.js` — contient `setupFiles: ["./integration-tests/setup.js"]` ; le répertoire `apps/backend/integration-tests/` **n'existe pas** (vérifié) → toute exécution de jest échoue au chargement.
- `apps/backend/src` — zéro fichier `*.spec.ts` / `*.test.ts`.
- Backend `npx tsc --noEmit` → 2 erreurs dans `apps/backend/src/admin/lib/sdk.ts:4-5` (`import.meta` dans un contexte CJS). Ce fichier est compilé par Vite (build admin séparé), pas par le tsconfig backend — l'erreur est un artefact de périmètre du tsconfig.
- `apps/storefront/package.json` — scripts `dev/build/preview/test` (vitest). Pas de `typecheck`. Après le plan 001, `npx tsc --noEmit` y est vert.
- Aucun répertoire `.github/` dans le repo.
- `README.md:76` documente `pnpm lint` → « Lint all apps » alors que c'est un no-op.
- Candidat de premier test backend sans DB : `apps/backend/src/api/store/quotes/validators.ts` — schéma zod pur (validation du POST /store/quotes), testable unitairement.

### Conventions du repo

- pnpm 9.15.4 (pin `packageManager`), Node >= 20, Turbo 2.x.
- Tests storefront : vitest (`apps/storefront/src/utils/sale-mode.test.ts` en modèle).
- Backend : jest est déjà configuré par type via `TEST_TYPE` (voir les scripts `test:*` existants) — s'y conformer, ne pas introduire vitest côté backend.

## Commands you will need

| Purpose             | Command                                             | Expected on success |
|---------------------|-----------------------------------------------------|---------------------|
| Install             | `pnpm install`                                      | exit 0              |
| Typecheck storefront| `pnpm --filter @dtc/storefront typecheck` (créé ici)| exit 0              |
| Typecheck backend   | `pnpm --filter @dtc/backend typecheck` (créé ici)   | exit 0              |
| Tests               | `pnpm test` (racine, via turbo)                     | 2 packages, verts   |
| Turbo task          | `pnpm exec turbo typecheck`                         | 2 packages, verts   |

## Scope

**In scope** :
- `turbo.json`
- `package.json` (racine)
- `apps/backend/package.json`
- `apps/backend/tsconfig.json` (périmètre `exclude` uniquement)
- `apps/backend/integration-tests/setup.js` (à créer)
- `apps/backend/src/api/store/quotes/validators.spec.ts` (à créer)
- `apps/storefront/package.json`
- `.github/workflows/ci.yml` (à créer)
- `README.md` (ligne sur `pnpm lint` uniquement)

**Out of scope** :
- Corriger d'autres erreurs de type que celles de périmètre décrites (si `tsc` révèle des erreurs inattendues → STOP).
- Introduire un linter (eslint/biome) — décision d'outillage à part ; ce plan retire juste la fausse promesse du README.
- Écrire des tests d'intégration DB (`test:integration:*`) — le premier test est unitaire et sans I/O.
- `apps/backend/src/admin/**` — l'admin est compilé par Vite, on l'exclut du tsc, on n'y touche pas.

## Git workflow

- Branche : `chore/verification-baseline` depuis `main` (après merge du plan 001).
- Commits par étape, conventional commits.
- Ne pas pousser ni ouvrir de PR sans instruction de l'opérateur.

## Steps

### Step 1: Scripts `typecheck` par app

1. `apps/storefront/package.json` → `"typecheck": "tsc --noEmit"`.
2. `apps/backend/package.json` → `"typecheck": "tsc --noEmit"`.
3. `apps/backend/tsconfig.json` → ajouter `"src/admin"` au tableau `exclude` (le créer s'il n'existe pas, en préservant les éventuelles entrées existantes). Justification en commentaire une ligne : l'admin est typé/compilé par Vite séparément.

**Verify**: `pnpm --filter @dtc/storefront typecheck` → exit 0 (nécessite le plan 001). `pnpm --filter @dtc/backend typecheck` → exit 0 (les 2 erreurs `sdk.ts` disparaissent avec l'exclusion).

### Step 2: Tâche Turbo + script racine

1. `turbo.json` : ajouter `"typecheck": { "outputs": [] }` ; corriger la tâche `build` : `"outputs": ["dist/**", ".medusa/**"]` (supprimer `.next/**`).
2. `package.json` racine : ajouter `"typecheck": "turbo typecheck"`.

**Verify**: `pnpm exec turbo typecheck` → « 2 successful » (les deux packages). `pnpm build` → exit 0 ; relancer `pnpm build` → le backend est « cache hit » (FULL TURBO ou équivalent).

### Step 3: Rendre les tests backend exécutables

1. Créer `apps/backend/integration-tests/setup.js`. Contenu de référence du starter Medusa (medusa-starter-default) :
   ```js
   const { MetadataStorage } = require("@mikro-orm/core")

   MetadataStorage.clear()
   ```
   Si le contenu exact du starter diffère (vérifiable via la doc Medusa ou le repo `medusajs/medusa-starter-default`, fichier `integration-tests/setup.js`), reprendre celui du starter.
2. `apps/backend/package.json` : ajouter `"test": "npm run test:unit -- --passWithNoTests"`. (`test:unit` existe déjà : `TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules jest --silent --runInBand --forceExit`.)

**Verify**: `pnpm --filter @dtc/backend test` → exit 0 (au pire « no tests found » accepté par `--passWithNoTests`, plus d'erreur de setup manquant).

### Step 4: Premier test backend réel (validator quotes)

Créer `apps/backend/src/api/store/quotes/validators.spec.ts` testant le schéma zod exporté par `apps/backend/src/api/store/quotes/validators.ts` (lire ce fichier d'abord pour les noms exacts) :

- payload valide (name/email/message…) → `safeParse.success === true` ;
- email invalide → échec ;
- champ requis manquant → échec.

Attention : jest tourne avec `TEST_TYPE=unit` ; vérifier dans `apps/backend/jest.config.js` quel pattern de nom de fichier est attendu (`testMatch`/`testRegex`) et nommer le fichier en conséquence (`.spec.ts` vs `.test.ts`).

**Verify**: `pnpm --filter @dtc/backend test` → exit 0, ≥3 tests verts (retirer `--passWithNoTests` du script si souhaité une fois des tests présents — optionnel).

### Step 5: Workflow CI

Créer `.github/workflows/ci.yml` :

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4        # lit packageManager du package.json
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec turbo typecheck test
```

Ne pas inclure `build` dans le job (le build backend Medusa peut exiger des variables d'environnement/DB ; à ajouter plus tard si prouvé autonome).

**Verify**: localement `pnpm exec turbo typecheck test` → tout vert (c'est exactement ce que CI exécutera). Valider la syntaxe YAML : `node -e "console.log('ok')"` n'est pas suffisant — utiliser `npx yaml-lint .github/workflows/ci.yml` ou une lecture attentive.

### Step 6: Corriger la promesse du README

`README.md` ligne 76 : remplacer la ligne du tableau `pnpm lint` par une mention honnête, p. ex. `| \`pnpm typecheck\` | Typecheck all apps |` (et retirer la ligne lint, ou la marquer « non configuré »). Laisser le reste du README intact.

**Verify**: `grep -n "pnpm lint" README.md` → 0 résultat (ou uniquement une mention « non configuré »).

## Test plan

- Nouveau test : `apps/backend/src/api/store/quotes/validators.spec.ts` (cas listés à l'étape 4). Aucun test existant backend — c'est le premier ; pour la structure, suivre la doc jest standard (describe/it/expect).
- Vérification globale : `pnpm exec turbo typecheck test` → 2 packages typecheck verts, 2 packages test verts.

## Done criteria

- [ ] `pnpm exec turbo typecheck` → exit 0 sur les 2 packages.
- [ ] `pnpm test` (racine) → exit 0 et exécute **les deux** apps (le backend n'est plus sauté).
- [ ] `apps/backend/integration-tests/setup.js` existe ; `pnpm --filter @dtc/backend test` exit 0 avec ≥3 tests.
- [ ] `.github/workflows/ci.yml` existe et exécute `pnpm exec turbo typecheck test`.
- [ ] `grep -n '".next/\*\*"' turbo.json` → 0 résultat ; `.medusa/**` présent dans les outputs de build.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport si :

- `pnpm --filter @dtc/storefront typecheck` échoue → le plan 001 n'est pas mergé ; exécuter 001 d'abord.
- Après exclusion de `src/admin`, le typecheck backend révèle **d'autres** erreurs ailleurs dans `src/` → les lister et s'arrêter (ne pas les corriger ici).
- `jest` échoue pour une raison autre que le setup manquant (ex. incompatibilité de version) après deux tentatives.
- Le schéma zod de `validators.ts` n'est pas exporté / pas importable sans démarrer Medusa → rapporter, ne pas contourner en démarrant un serveur.

## Maintenance notes

- Quand un linter sera choisi (eslint ou biome), l'ajouter comme tâche Turbo `lint` et au workflow CI — le README pourra alors re-documenter `pnpm lint`.
- Le job CI n'exécute pas `build` ; le jour où le build backend est prouvé autonome (sans DB), l'ajouter au `turbo` du workflow.
- Les suites `test:integration:*` restent non couvertes par CI (elles exigent Postgres) ; prochain incrément logique : un service Postgres dans le workflow.
