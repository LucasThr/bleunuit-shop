# Plan 004: Optimiser les images locales (poids, formats) et purger les assets orphelins

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- apps/storefront/public/images apps/storefront/src/utils/category-image.ts apps/storefront/src/pages/index.astro apps/storefront/src/utils/product-card.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (indépendant ; ne pas exécuter en parallèle du plan 001 sur la même branche — `product-card.ts` est touché par les deux)
- **Category**: perf
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

L'image LCP de la homepage (`hero-room.jpg`) pèse **668 Ko** ; une tuile catégorie est un PNG photographique de **500 Ko** (`sommiers.png`) ; le héros des pages produits (`hero-bedroom.jpg`) pèse 385 Ko. Aucune image du site n'a de `srcset` ni de variante WebP/AVIF — un mobile télécharge les 1920 px du desktop. S'y ajoutent ~450 Ko d'assets orphelins livrés dans l'artefact de déploiement, et un placeholder produit servi par `placehold.co` (dépendance réseau externe pour un pixel gris). Les Core Web Vitals sont un facteur de classement confirmé ; c'est le levier n°1 restant de l'audit SEO du 25/06.

## Current state

### Poids actuels (vérifiés au commit 297b7c2)

| Fichier | Poids | Usage |
|---|---|---|
| `apps/storefront/public/images/design/hero-room.jpg` | 668 Ko | LCP homepage (`index.astro:211`, `fetchpriority="high"`, rendu full-bleed, `width="1920" height="1280"`) |
| `apps/storefront/public/images/categories/sommiers.png` | 500 Ko | tuile catégorie (`category-image.ts:7-8`), rendue 640×800 |
| `apps/storefront/public/images/design/hero-bedroom.jpg` | 385 Ko | héros `/produits` + fallback héros catégories + section « Notre histoire » |
| `apps/storefront/public/images/stores/bruay-la-buissiere.jpg` | ~296 Ko | carte magasin homepage (lazy) |
| `apps/storefront/public/images/design/hero-banner.png` | ~127 Ko | **orphelin** (0 référence dans `src/`) |
| `apps/storefront/public/favicon.svg` | — | **orphelin** (remplacé par favicon-64.png ; déjà noté « safe to delete » dans SEO_AUDIT.md) |
| `apps/storefront/public/images/brands/*/logo.png` | ~187 Ko | suspects orphelins — les logos viennent du CMS (`catalog-client.ts` `brand.logo`) ; **vérifier le seed avant suppression** (étape 4) |
| `apps/storefront/public/images/products/*`, `public/images/blog/*` | ~2 Ko | placeholders morts (produits/blog viennent de Medusa/CMS) — même vérification |

### Références dans le code

- `category-image.ts:5-15` mappe les slugs vers `/images/categories/*.jpg|png` — si un fichier est renommé (ex. `.png` → `.jpg`), **mettre à jour ce map**.
- `index.astro:39` : `image: homepage?.hero_image || "/images/design/hero-room.jpg"` (le CMS peut surcharger ; le fallback local est ce qu'on optimise).
- `product-card.ts:28-30` : placeholder externe :
  ```ts
  image:
    product.featured_image ||
    `https://placehold.co/800x600/e5e7eb/6b7280?text=${encodeURIComponent(product.name || 'Product')}`,
  ```
  et `p/[slug].astro:145` répète le même pattern `placehold.co` pour l'image principale.
- Toutes les balises `<img>` locales ont déjà `width`/`height`/`loading`/`decoding` corrects (posés lors du sprint SEO de juin) — ne pas y toucher, sauf ajout de `srcset`.

### Contrainte outillage

Pas de pipeline d'images dans le repo (pas d'`astro:assets` pour ces fichiers car ils sont dans `public/` et référencés par chemin depuis un map/le CMS). L'optimisation se fait **hors bande** : régénérer les binaires avec `sharp-cli` (`npx sharp-cli`) ou, sur macOS, `sips` + `cwebp`. La migration complète vers `astro:assets` est un chantier séparé, noté au backlog.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Recompresser JPEG | `npx sharp-cli -i <in> -o <out> resize 1920 -- jpeg -q 72 --mozjpeg` | fichier de sortie < budget |
| Variante WebP | `npx sharp-cli -i <in> -o <out.webp> resize <w> -- webp -q 75` | idem |
| Poids | `ls -la apps/storefront/public/images/...` | budgets du Done criteria |
| Build | `pnpm --filter @dtc/storefront build` | exit 0 |
| Tests | `pnpm --filter @dtc/storefront test` | verts |

(Si `sharp-cli` n'est pas installable, `sips -Z 1920 -s formatOptions 72` sur macOS pour les JPEG ; à défaut STOP.)

## Scope

**In scope** :
- Binaires sous `apps/storefront/public/images/**` et `apps/storefront/public/favicon.svg` (recompression, conversion, suppression d'orphelins).
- `apps/storefront/src/utils/category-image.ts` (chemins du map si extensions changent).
- `apps/storefront/src/pages/index.astro`, `apps/storefront/src/components/PageHero.astro` (ajout `srcset`/`<picture>` sur les héros locaux uniquement).
- `apps/storefront/src/utils/product-card.ts` et `apps/storefront/src/pages/produits/[category]/p/[slug].astro` (remplacement du placeholder externe uniquement).
- `apps/storefront/public/images/placeholder-product.svg` (à créer).

**Out of scope** :
- `productImageUrl()` et le redimensionnement des images **distantes** Medusa — nécessite une infra de transformation (CDN/R2), décision à part (backlog).
- `og-default.jpg` (116 Ko, taille sociale exacte — correct tel quel).
- Migration `astro:assets` (chantier séparé).
- Tout changement de layout/design.

## Git workflow

- Branche : `perf/optimize-images` depuis `main`.
- Un commit par étape ; conventional commits. Ne pas pousser sans instruction.

## Steps

### Step 1: Recompresser les 3 grosses photos

Budgets (qualité visuelle à vérifier à l'œil sur chaque sortie) :

1. `hero-room.jpg` : re-encoder à 1920 px de large max, JPEG qualité ~72 → **≤ 250 Ko**.
2. `sommiers.png` → **convertir en JPEG** `sommiers.jpg` (c'est une photo), 1280 px max → **≤ 120 Ko**. Mettre à jour `category-image.ts:7-8` (`sommiers`/`sommier` → `/images/categories/sommiers.jpg`) et supprimer le `.png`.
3. `hero-bedroom.jpg` : re-encoder qualité ~72 → **≤ 220 Ko**.

**Verify**: `ls -la` sur les 3 fichiers → budgets respectés ; `grep -rn "sommiers.png" apps/storefront/src` → 0 résultat.

### Step 2: Variantes responsive pour les héros locaux

Pour `hero-room.jpg` et `hero-bedroom.jpg`, générer des variantes 768 px et 1280 px (`-768.jpg`, `-1280.jpg`) à côté des originaux, puis :

- `index.astro` (héros, ligne ~210) : ajouter `srcset`/`sizes` **uniquement quand l'image est le fallback local** (le CMS peut fournir `hero_image` distant sans variantes) :
  ```astro
  srcset={hero.image === "/images/design/hero-room.jpg"
    ? "/images/design/hero-room-768.jpg 768w, /images/design/hero-room-1280.jpg 1280w, /images/design/hero-room.jpg 1920w"
    : undefined}
  sizes="100vw"
  ```
- `PageHero.astro` : même approche via une prop optionnelle `srcset` passée par les pages qui utilisent `/images/design/hero-bedroom.jpg` (`produits/index.astro:41`, fallback de `[category].astro:50`).

**Verify**: `pnpm --filter @dtc/storefront build` → exit 0. En dev, l'inspecteur réseau charge la variante 768 sur un viewport mobile.

### Step 3: Remplacer le placeholder externe placehold.co

1. Créer `apps/storefront/public/images/placeholder-product.svg` — un SVG léger (< 1 Ko) : fond `#e5e7eb`, pictogramme lit/matelas ou simple libellé « Photo à venir » en `#6b7280`.
2. `product-card.ts` : remplacer l'URL `https://placehold.co/...` par `/images/placeholder-product.svg`.
3. `p/[slug].astro:145` : idem.

**Verify**: `grep -rn "placehold.co" apps/storefront/src` → 0 résultat ; `pnpm --filter @dtc/storefront test` → verts (si le plan 001 a ajouté un test sur le placeholder, l'adapter à la nouvelle URL — modification de test attendue, pas un STOP).

### Step 4: Purger les orphelins

1. Supprimer directement : `public/images/design/hero-banner.png`, `public/favicon.svg` (déjà documenté comme non référencé dans SEO_AUDIT.md).
2. Pour `public/images/brands/**`, `public/images/products/*.jpg`, `public/images/blog/*` : vérifier d'abord qu'aucune référence n'existe **ni dans le code ni dans le seed** :
   ```bash
   grep -rn "images/brands\|images/products\|images/blog" apps/storefront/src apps/backend/src
   ```
   Supprimer uniquement les fichiers dont le chemin n'apparaît nulle part. Si le seed backend (`apps/backend/src/scripts/seed-bleunuit.ts` ou `src/migration-scripts/`) référence certains chemins, **les conserver** et le noter dans le rapport final.

**Verify**: `pnpm --filter @dtc/storefront build` → exit 0 ; navigation dev sans 404 d'images (vérifier la console réseau sur `/`, `/produits`, une page catégorie, un article de blog).

## Test plan

- Pas de nouveau test unitaire (changements de binaires + attributs) ; si le plan 001 a créé `product-card.test.ts`, adapter l'assertion du placeholder à `/images/placeholder-product.svg`.
- Vérification visuelle obligatoire : homepage, `/produits`, une page catégorie, une page produit sans image — rendu identique, pas de 404.

## Done criteria

- [ ] `ls -la apps/storefront/public/images/design/hero-room.jpg` ≤ 250 Ko ; `hero-bedroom.jpg` ≤ 220 Ko ; `categories/sommiers.jpg` ≤ 120 Ko et `sommiers.png` supprimé.
- [ ] Variantes `-768`/`-1280` présentes pour les 2 héros et référencées via `srcset`.
- [ ] `grep -rn "placehold.co" apps/storefront/src` → 0 résultat.
- [ ] `hero-banner.png` et `favicon.svg` supprimés ; orphelins restants soit supprimés, soit listés avec leur référence trouvée.
- [ ] `pnpm --filter @dtc/storefront build` et `test` → exit 0.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport si :

- Aucun outil de compression d'images n'est disponible/installable dans l'environnement (`sharp-cli`, `sips`, ImageMagick) — ne pas committer d'images non optimisées « en attendant ».
- Une image recompressée présente des artefacts visibles au budget cible — remonter avec le meilleur compromis trouvé plutôt que de dépasser le budget silencieusement.
- Des références aux répertoires « orphelins » existent dans le seed/DB backend — conserver ces fichiers et le signaler.

## Maintenance notes

- Les futures photos ajoutées dans `public/images/` doivent suivre les mêmes budgets (photo = JPEG/WebP, jamais PNG ; héros ≤ 250 Ko). Bon candidat pour une note dans le README storefront.
- Le vrai levier suivant est le redimensionnement des images **produits** (distantes, servies par Medusa/R2 à taille d'upload) : nécessite un file provider avec transformations ou un CDN d'images — décision infra, voir backlog de `plans/README.md`.
- Si la homepage reçoit un jour un `hero_image` CMS, le `srcset` conditionnel de l'étape 2 s'éteint proprement (image distante servie telle quelle).
