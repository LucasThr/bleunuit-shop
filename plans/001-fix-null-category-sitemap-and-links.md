# Plan 001: Rendre le catalogue robuste aux produits sans catégorie parente (sitemap, liens, canonical)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- apps/storefront/src/pages/sitemap.xml.ts apps/storefront/src/utils/catalog-client.ts apps/storefront/src/utils/product-card.ts apps/storefront/src/pages/produits/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (SEO-critical)
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

`typeof null === 'object'` in JavaScript. Three call sites use `typeof x === 'object'` as a null-guard on the product/subcategory `category` field, which is typed `ProductCategoryRef | null`. Consequence: **un seul produit sans catégorie parente fait planter la génération du sitemap**, l'exception est avalée par le `try/catch` (prévu pour "Medusa injoignable"), et le sitemap se dégrade silencieusement à 4 URLs statiques — une régression SEO invisible. Le même produit obtient des liens de carte cassés (`/produits//p/<slug>`, double slash) et un canonical absurde. Ces deux bugs sont exactement les 2 erreurs que `tsc --noEmit` rapporte aujourd'hui — les corriger nettoie aussi le typecheck (prérequis du plan 002).

Un produit n'a pas de catégorie parente dans deux cas réalistes : (a) il est assigné **uniquement à une sous-catégorie** dans Medusa (le tableau `categories` du produit ne contient alors que la sous-catégorie, pas son parent), ou (b) il n'a aucune catégorie (erreur de saisie).

## Current state

Fichiers concernés :

- `apps/storefront/src/pages/sitemap.xml.ts` — génère le sitemap ; contient les 2 gardes défaillants (lignes 29 et 37-38).
- `apps/storefront/src/utils/catalog-client.ts` — mapping Medusa → shapes storefront ; `toProduct()` (lignes 134-161) dérive `category` (parente) et `subcategory` du tableau `categories` du produit.
- `apps/storefront/src/utils/product-card.ts` — `mapProductToCard()` produit le `categorySlug` des cartes ; contient aussi du polymorphisme mort hérité de Directus.
- `apps/storefront/src/pages/produits/[category]/p/[slug].astro` — page produit ; branches mortes `typeof product.brand === 'object'` (lignes 61, 183-184).

### Extraits (état actuel)

`apps/storefront/src/pages/sitemap.xml.ts:28-39` :

```ts
    for (const sub of subcategories) {
      const categoryId = typeof sub.category === 'object' ? sub.category.id : sub.category;
      const category = categoriesById.get(categoryId);
      if (category) {
        paths.push(`/produits/${slugFor(category)}/${slugFor(sub)}`);
      }
    }

    for (const product of products) {
      if (!product.slug || typeof product.category !== 'object') continue;
      paths.push(`/produits/${slugFor(product.category)}/p/${product.slug}`);
    }
```

Bug : `Subcategory.category` est typé `string | null` et `Product.category` est typé `ProductCategoryRef | null` (voir `catalog-client.ts:25` et `:40`). Pour `null`, `typeof null === 'object'` : ligne 29 déréférence `null.id` ; ligne 37 laisse passer `null` puis `slugFor(null)` jette (`slugs.ts:14-16` lit `item.slug`). L'exception remonte au `try/catch` englobant (ligne 44 : `// Medusa unreachable: still serve the static routes.`) → sitemap réduit aux 4 routes statiques.

`tsc --noEmit` reproduit les deux (vérifié au commit 297b7c2) :

```
src/pages/sitemap.xml.ts(29,61): error TS18047: 'sub.category' is possibly 'null'.
src/pages/sitemap.xml.ts(38,39): error TS2345: Argument of type 'ProductCategoryRef | null' is not assignable ...
```

`apps/storefront/src/utils/catalog-client.ts:100-103` (champs demandés à Medusa) :

```ts
const PRODUCT_FIELDS =
  "id,title,handle,description,thumbnail,metadata," +
  "categories.id,categories.name,categories.handle,categories.parent_category_id," +
  "variants.id,*variants.calculated_price";
```

`apps/storefront/src/utils/catalog-client.ts:134-151` (`toProduct`, dérivation parent/sub) :

```ts
function toProduct(p: MedusaProduct): Product {
  const cats = p.categories ?? [];
  const parent = cats.find((c) => !c.parent_category_id) ?? null;
  const sub = cats.find((c) => c.parent_category_id) ?? null;
```

→ si le produit n'est assigné qu'à une sous-catégorie, `parent` est `null` alors que le parent existe dans Medusa.

`apps/storefront/src/utils/product-card.ts:17-35` (extrait) :

```ts
export function mapProductToCard(product: Product) {
  const category = typeof product.category === 'object' ? product.category : null;

  return {
    ...
    brand:
      typeof product.brand === 'object'
        ? (product.brand as any)?.name || ''
        : product.brand || '',
    ...
    categorySlug: category ? slugFor(category) : String(product.category ?? ''),
    categoryName: category ? category.name : String(product.category ?? ''),
  };
}
```

Bugs/dette : `categorySlug` retombe sur `''` → le lien de carte devient `/produits//p/<slug>` (`ProductCard.astro:19` : `href={`/produits/${categorySlug}/p/${slug}`}`). `Product.brand` est typé `string` (`catalog-client.ts:39`) — la branche `typeof === 'object'` est du code mort hérité de Directus, idem dans `p/[slug].astro:61,183-184`.

`apps/storefront/src/pages/produits/[category]/p/[slug].astro:24-31` : quand `productCategory` est `null`, `categorySlug` retombe sur `'produits'` → canonical `/produits/produits/p/<slug>`. C'est laid mais routable ; on aligne la carte sur ce même fallback (déterminisme), le vrai correctif étant la résolution du parent (étape 2).

### Conventions du repo

- TypeScript strict-ish, pas de `@ts-ignore` dans le storefront. Style de commit : conventional (`fix: …`, `feat: …` — voir `git log --oneline`).
- Tests storefront : vitest, un seul fichier existant `apps/storefront/src/utils/sale-mode.test.ts` — **à utiliser comme modèle de structure**.
- Vocabulaire (CONTEXT.md) : « catégorie » = catégorie parente Medusa, « sous-catégorie » = catégorie enfant (via `parent_category_id`).

## Commands you will need

| Purpose   | Command                                                    | Expected on success |
|-----------|------------------------------------------------------------|---------------------|
| Install   | `pnpm install` (racine du repo)                            | exit 0              |
| Typecheck | `cd apps/storefront && npx tsc --noEmit`                   | exit 0, 0 erreur    |
| Tests     | `pnpm --filter @dtc/storefront test`                       | tous verts          |
| Build     | `pnpm --filter @dtc/storefront build`                      | exit 0              |

## Scope

**In scope** (seuls fichiers modifiables) :
- `apps/storefront/src/pages/sitemap.xml.ts`
- `apps/storefront/src/utils/catalog-client.ts`
- `apps/storefront/src/utils/product-card.ts`
- `apps/storefront/src/utils/product-card.test.ts` (à créer)
- `apps/storefront/src/pages/produits/[category]/p/[slug].astro` (uniquement les branches `typeof product.brand === 'object'`)
- `apps/storefront/src/pages/produits/[category]/[subcategory].astro` (uniquement le garde lignes 23-25)

**Out of scope** (ne pas toucher, même si ça semble lié) :
- `apps/storefront/src/utils/sale-mode.ts` — logique CTA, propriétaire unique documenté dans CONTEXT.md.
- La mise en cache / mémoïsation des fetchs (plan 003).
- Le backend Medusa (`apps/backend/**`).
- Les templates visuels des cartes (`ProductCard.astro`, `ProductGrid.astro`).

## Git workflow

- Branche : `fix/null-category-sitemap` depuis `main`.
- Commits par étape, style conventional commits (ex. du repo : `fix: update references from Directus to Medusa across multiple files`).
- Ne pas pousser ni ouvrir de PR sans instruction de l'opérateur.

## Steps

### Step 1: Corriger les gardes null du sitemap

Dans `apps/storefront/src/pages/sitemap.xml.ts` :

- Ligne 29 : remplacer par un accès null-safe. `Subcategory.category` est `string | null` (jamais un objet — voir `toSubcategory`, `catalog-client.ts:123-132`) ; simplifier en :
  ```ts
  const categoryId = sub.category;
  if (!categoryId) continue;
  const category = categoriesById.get(categoryId);
  ```
- Ligne 37 : remplacer le garde par un null-check direct :
  ```ts
  if (!product.slug || !product.category) continue;
  ```

**Verify**: `cd apps/storefront && npx tsc --noEmit` → exit 0, plus aucune erreur sur `sitemap.xml.ts` (c'étaient les 2 seules erreurs du storefront).

### Step 2: Résoudre la catégorie parente dans `toProduct` quand seul une sous-catégorie est assignée

Dans `apps/storefront/src/utils/catalog-client.ts` :

1. Ajouter les champs du parent à `PRODUCT_FIELDS` :
   ```ts
   const PRODUCT_FIELDS =
     "id,title,handle,description,thumbnail,metadata," +
     "categories.id,categories.name,categories.handle,categories.parent_category_id," +
     "categories.parent_category.id,categories.parent_category.name,categories.parent_category.handle," +
     "variants.id,*variants.calculated_price";
   ```
2. Étendre le type `MedusaCategory` avec `parent_category?: { id: string; name: string; handle: string } | null`.
3. Dans `toProduct`, si `parent` est `null` mais `sub` existe, dériver le parent depuis `sub.parent_category` :
   ```ts
   const parentFromSub = sub?.parent_category ?? null;
   const effectiveParent = parent ?? parentFromSub;
   ```
   puis utiliser `effectiveParent` pour construire `category`.

**Verify**: `cd apps/storefront && npx tsc --noEmit` → exit 0. Puis, si un backend Medusa local tourne (`http://localhost:9000`), lancer `pnpm --filter @dtc/storefront dev` et requêter `curl -s localhost:4321/sitemap.xml | head -30` → le sitemap contient les URLs produits. Si aucun backend local n'est disponible, la vérification runtime est reportée au test unitaire de l'étape 4.

### Step 3: Nettoyer le polymorphisme mort hérité de Directus

1. `apps/storefront/src/utils/product-card.ts` :
   - `brand`: remplacer le ternaire `typeof product.brand === 'object' ? … : …` par `product.brand || ''` (le type est `string`).
   - `categorySlug` / `categoryName` : remplacer les fallbacks `String(product.category ?? '')` par `'produits'` et `'Produits'` respectivement (aligné sur le fallback de la page produit, `p/[slug].astro:25-26`), avec un commentaire d'une ligne expliquant que c'est le fallback routable pour un produit sans catégorie.
2. `apps/storefront/src/pages/produits/[category]/p/[slug].astro` :
   - Ligne 61 : `const brandName = product.brand;`
   - Lignes 183-184 : utiliser `product.brand` directement dans le JSX.
3. `apps/storefront/src/pages/produits/[category]/[subcategory].astro` lignes 23-25 : remplacer le ternaire `typeof currentSubcategory.category === 'object' ? currentSubcategory.category.id : currentSubcategory.category` par `currentSubcategory.category` (type `string | null`).

**Verify**: `cd apps/storefront && npx tsc --noEmit` → exit 0. `grep -rn "typeof product.brand" apps/storefront/src/` → 0 résultat.

### Step 4: Tests unitaires

Créer `apps/storefront/src/utils/product-card.test.ts` (modèle : `sale-mode.test.ts`), couvrant `mapProductToCard` :

- produit avec `category` renseignée → `categorySlug` = slug de la catégorie ;
- produit avec `category: null` → `categorySlug === 'produits'` (jamais `''` — c'est la régression corrigée) ;
- produit sans `featured_image` → l'URL placeholder est retournée ;
- `brand` string vide → `brand === ''`.

**Verify**: `pnpm --filter @dtc/storefront test` → tous les tests passent (les 6 de sale-mode + les nouveaux).

## Test plan

- Nouveaux tests : `apps/storefront/src/utils/product-card.test.ts` (cas listés à l'étape 4).
- Modèle structurel : `apps/storefront/src/utils/sale-mode.test.ts`.
- Vérification : `pnpm --filter @dtc/storefront test` → verts ; `npx tsc --noEmit` → 0 erreur.

## Done criteria

- [ ] `cd apps/storefront && npx tsc --noEmit` exit 0 (0 erreur, contre 2 avant).
- [ ] `pnpm --filter @dtc/storefront test` exit 0, incluant ≥4 nouveaux tests `product-card`.
- [ ] `grep -n "typeof sub.category" apps/storefront/src/pages/sitemap.xml.ts` → 0 résultat.
- [ ] `grep -rn "typeof product.brand === 'object'" apps/storefront/src/` → 0 résultat.
- [ ] `pnpm --filter @dtc/storefront build` exit 0.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport (ne pas improviser) si :

- Le code aux emplacements cités ne correspond pas aux extraits (dérive depuis 297b7c2).
- L'API store de Medusa **rejette** le champ `categories.parent_category.*` (erreur 400 ou champ absent de la réponse) : dans ce cas appliquer uniquement les étapes 1, 3, 4 (le sitemap et les liens sont déjà rendus sûrs) et signaler que la résolution du parent nécessite une autre voie (ex. jointure via la liste des catégories déjà fetchée).
- Une vérification échoue deux fois après une tentative de correction raisonnable.

## Maintenance notes

- Si un jour les produits peuvent appartenir à plusieurs catégories parentes, la logique `cats.find(...)` de `toProduct` devra choisir une canonique (première par `rank`) — sinon les canonicals deviennent instables.
- Le fallback `'produits'` pour un produit sans aucune catégorie reste un pis-aller : la vraie hygiène est de garantir côté admin qu'un produit publié a toujours une catégorie. À évoquer en revue.
- Le plan 002 (baseline CI/typecheck) dépend de ce plan : c'est lui qui rend `tsc --noEmit` vert côté storefront.
