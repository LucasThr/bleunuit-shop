# Plan 003: Supprimer les re-fetchs massifs de la couche catalogue (mémoïsation + requêtes ciblées)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- apps/storefront/src/utils/catalog-client.ts apps/storefront/src/utils/ttl-cache.ts apps/storefront/src/pages/produits/ apps/storefront/src/pages/index.astro`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. **Note** : le plan 001 modifie
> légitimement `catalog-client.ts` (PRODUCT_FIELDS + toProduct) — cette
> dérive-là est attendue, pas un STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW-MED (fenêtre de staleness de 60 s, voir étape 1)
- **Depends on**: plans/001-fix-null-category-sitemap-and-links.md (touche les mêmes fichiers ; exécuter 001 d'abord pour éviter les conflits)
- **Category**: perf
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

Chaque rendu SSR déclenche une rafale d'appels HTTP identiques vers Medusa. Le Header (présent sur toutes les pages) fetch la liste complète des ~200 catégories **deux fois** ; une page catégorie en refait 2 de plus ; la page sous-catégorie les fait **en séquence**. La homepage télécharge le **catalogue entier** (200 produits avec variantes, prix calculés et descriptions HTML) pour afficher 4 produits vedettes ; chaque page produit re-télécharge toute sa catégorie pour 3 « produits similaires » ; et les listes embarquent le champ `description` (HTML complet) que les cartes n'utilisent jamais. C'est la composante dominante du TTFB sur toutes les routes. Une mémoïsation TTL courte + des field-sets adaptés suppriment 60-80 % de ces octets et round-trips sans changer aucun rendu.

## Current state

Fichiers :

- `apps/storefront/src/utils/catalog-client.ts` — tous les accès catalogue. `fetchAllCategories()` (lignes 165-171) et `fetchProducts()` (lignes 173-183) émettent un fetch réseau à chaque appel, sans cache. Cinq helpers appellent `fetchAllCategories()` indépendamment : `getAllCategories` (:190), `getCategoryBySlug` (:198), `getAllSubcategories` (:206), `getSubcategoriesByCategory` (:214), `getSubcategoryBySlug` (:224).
- `apps/storefront/src/components/Header.astro:15-18` — sur **chaque page** :
  ```ts
  [allCategories, allSubcategories] = await Promise.all([
    getAllCategories(),
    getAllSubcategories(),
  ]);
  ```
  → 2 fetchs complets de la même liste.
- `apps/storefront/src/pages/produits/[category]/[subcategory].astro:15-16` — séquentiel :
  ```ts
  const currentCategory = await getCategoryBySlug(category!);
  const currentSubcategory = await getSubcategoryBySlug(subcategory!);
  ```
- `apps/storefront/src/utils/catalog-client.ts:241-247` :
  ```ts
  export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
    const products = await fetchProducts();
    return products
      .map(toProduct)
      .filter((p) => p.featured && p.in_stock)
      .slice(0, limit);
  }
  ```
  (`featured` vit dans `metadata.featured` — l'API store Medusa **ne filtre pas sur metadata**, d'où le filtre en mémoire ; on le garde mais on allège les champs.)
- `apps/storefront/src/pages/produits/[category]/p/[slug].astro:55-59` — produits similaires :
  ```ts
  const allProducts = await getProductsByCategory(categoryId);
  const relatedProducts = allProducts.filter(p => p.slug !== slug).slice(0, 3).map(mapProductToCard);
  ```
- `PRODUCT_FIELDS` (`catalog-client.ts:100-103`) inclut `description` ; le seul consommateur des listes est `mapProductToCard` (`product-card.ts:17-35`) qui ne lit jamais `description`. Seule la page produit (`getProductBySlug`) en a besoin.
- Environnement d'exécution : Astro SSR `output: 'server'`, adaptateur `@astrojs/node` standalone → **un processus Node long-vivant** ; un cache module-level y survit entre requêtes. C'est voulu ici (TTL court), documenté ci-dessous.

### Conventions du repo

- Tests : vitest, modèle `apps/storefront/src/utils/sale-mode.test.ts`.
- Les helpers catalogue retournent les « shapes Directus-compatibles » documentées en tête de `catalog-client.ts` — ne pas changer les types publics.

## Commands you will need

| Purpose   | Command                                  | Expected on success |
|-----------|------------------------------------------|---------------------|
| Typecheck | `cd apps/storefront && npx tsc --noEmit` | exit 0              |
| Tests     | `pnpm --filter @dtc/storefront test`     | tous verts          |
| Build     | `pnpm --filter @dtc/storefront build`    | exit 0              |

## Scope

**In scope** :
- `apps/storefront/src/utils/catalog-client.ts`
- `apps/storefront/src/utils/ttl-cache.ts` (à créer)
- `apps/storefront/src/utils/ttl-cache.test.ts` (à créer)
- `apps/storefront/src/pages/produits/[category]/[subcategory].astro` (lignes 15-16 uniquement)
- `apps/storefront/src/pages/produits/[category]/p/[slug].astro` (l'appel produits similaires uniquement)

**Out of scope** :
- `cms-client.ts` (mêmes patterns, mais collections minuscules — gain négligeable ; noté en backlog).
- Les en-têtes HTTP `Cache-Control` (plan 005).
- Toute modification des templates/markup.
- `sale-mode.ts`, `medusa.ts` (config SDK).

## Git workflow

- Branche : `perf/catalog-data-layer` depuis `main` (après merge du plan 001).
- Conventional commits ; ne pas pousser sans instruction.

## Steps

### Step 1: Utilitaire de mémoïsation TTL

Créer `apps/storefront/src/utils/ttl-cache.ts` :

```ts
// Mémoïse une fonction async sans argument pendant `ttlMs`. Déduplique aussi
// les appels concurrents (un seul fetch en vol). Utilisé pour les listes
// catalogue : le processus SSR est long-vivant, un TTL court borne la
// staleness après une édition dans l'admin Medusa.
export function memoizeTtl<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let value: Promise<T> | null = null;
  let expiresAt = 0;
  return () => {
    const now = Date.now();
    if (!value || now >= expiresAt) {
      expiresAt = now + ttlMs;
      value = fn().catch((err) => {
        value = null; // ne jamais mettre en cache un échec
        throw err;
      });
    }
    return value;
  };
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Mémoïser la liste des catégories

Dans `catalog-client.ts`, envelopper `fetchAllCategories` :

```ts
const CATEGORY_TTL_MS = 60_000;
const fetchAllCategoriesCached = memoizeTtl(fetchAllCategoriesRaw, CATEGORY_TTL_MS);
```

(renommer l'actuelle fonction en `fetchAllCategoriesRaw`, faire pointer les 5 helpers sur la version cachée). Ne rien changer aux signatures exportées.

**Verify**: `npx tsc --noEmit` → exit 0 ; `pnpm --filter @dtc/storefront test` → verts. Si un backend local tourne : charger deux pages coup sur coup en dev et vérifier dans les logs Medusa (ou via un `console.count` temporaire retiré ensuite) qu'un seul `category.list` part par fenêtre de 60 s.

### Step 3: Field-set allégé pour les listes

Dans `catalog-client.ts` :

1. Créer `PRODUCT_LIST_FIELDS` = `PRODUCT_FIELDS` **sans** `description`.
2. `fetchProducts` prend un paramètre optionnel `fields` (défaut `PRODUCT_LIST_FIELDS`).
3. `getProductBySlug` passe explicitement `PRODUCT_FIELDS` (la page produit a besoin de la description) ; tous les autres helpers de liste utilisent le field-set allégé.

Attention : après le plan 001, `PRODUCT_FIELDS` contient aussi `categories.parent_category.*` — le conserver dans **les deux** field-sets (les cartes ont besoin du slug de catégorie).

**Verify**: `npx tsc --noEmit` → exit 0. Avec backend local : la page produit affiche toujours sa description ; les pages listes s'affichent normalement.

### Step 4: Limiter la requête « produits similaires »

Dans `p/[slug].astro`, remplacer l'appel par une variante bornée. Ajouter dans `catalog-client.ts` :

```ts
export async function getRelatedProducts(categoryId: string, excludeSlug: string, limit = 3): Promise<Product[]> {
  const products = await fetchProducts({ category_id: [categoryId], limit: limit + 1 });
  return products.map(toProduct).filter((p) => p.slug !== excludeSlug).slice(0, limit);
}
```

et l'utiliser à la place de `getProductsByCategory` + filter + slice.

**Verify**: `npx tsc --noEmit` → exit 0 ; avec backend local, une page produit affiche jusqu'à 3 produits similaires ≠ produit courant.

### Step 5: Paralléliser la page sous-catégorie

`[subcategory].astro:15-16` →

```ts
const [currentCategory, currentSubcategory] = await Promise.all([
  getCategoryBySlug(category!),
  getSubcategoryBySlug(subcategory!),
]);
```

(Avec la mémoïsation de l'étape 2, les deux se résolvent de toute façon sur le même fetch.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 6: Tests

Créer `apps/storefront/src/utils/ttl-cache.test.ts` (modèle : `sale-mode.test.ts`), avec `vi.useFakeTimers()` :

- deux appels dans la fenêtre TTL → la fonction sous-jacente n'est appelée qu'une fois ;
- appel après expiration du TTL → nouvelle invocation ;
- appels concurrents (deux appels avant résolution) → une seule invocation ;
- rejet de la promesse → l'échec n'est pas mis en cache (l'appel suivant ré-invoque).

**Verify**: `pnpm --filter @dtc/storefront test` → tous verts.

## Test plan

- `ttl-cache.test.ts` : 4 cas ci-dessus, fake timers vitest.
- Pas de test réseau : les helpers catalogue restent non testés unitairement (ils encapsulent le SDK) — la vérification est le typecheck + build + smoke test dev.
- Vérification : `pnpm --filter @dtc/storefront test` et `pnpm --filter @dtc/storefront build` → exit 0.

## Done criteria

- [ ] `npx tsc --noEmit` (storefront) exit 0.
- [ ] `pnpm --filter @dtc/storefront test` exit 0, incluant ≥4 tests `ttl-cache`.
- [ ] `grep -n "memoizeTtl" apps/storefront/src/utils/catalog-client.ts` → ≥1 résultat.
- [ ] `grep -n "await getCategoryBySlug" "apps/storefront/src/pages/produits/[category]/[subcategory].astro"` → 0 résultat en dehors du `Promise.all`.
- [ ] `grep -n "description" apps/storefront/src/utils/catalog-client.ts` montre `description` absent de `PRODUCT_LIST_FIELDS` et présent dans `PRODUCT_FIELDS`.
- [ ] `pnpm --filter @dtc/storefront build` exit 0.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport si :

- Les extraits « Current state » ne correspondent plus (hors modifications attendues du plan 001).
- L'API Medusa rejette une requête avec le field-set allégé (400) → lister le champ en cause, ne pas improviser d'autres retraits.
- La suppression de `description` casse un consommateur non identifié (chercher d'abord : `grep -rn "\.description" apps/storefront/src/pages apps/storefront/src/components` — seuls la page produit, les pages catégorie/sous-catégorie (description de **catégorie**, pas produit) et les meta descriptions doivent en dépendre).
- Une vérification échoue deux fois.

## Maintenance notes

- Le TTL de 60 s borne la staleness du menu/nav après une édition de catégories dans l'admin. Si le marchand se plaint d'un délai de mise à jour, réduire `CATEGORY_TTL_MS`, ne pas supprimer le cache.
- Si le déploiement passe un jour en multi-instances derrière un load-balancer, ce cache par processus reste correct (staleness par instance ≤ TTL).
- « Featured » reste filtré en mémoire car l'API store Medusa ne filtre pas sur `metadata`. Le jour où le catalogue dépasse ~200 produits (la `limit` actuelle), modéliser « featured » comme une collection Medusa et filtrer par `collection_id` — noté au backlog de `plans/README.md`.
- Le plan 005 (Cache-Control) multiplie l'effet de ce plan : les deux ensemble ramènent la plupart des vues à zéro appel Medusa.
