# Plan 006: Lot de corrections SEO on-page (hiérarchie Hn, JSON-LD manquants, robots, horaires, filtres blog)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- apps/storefront/src/layouts/Layout.astro apps/storefront/src/pages/produits/index.astro apps/storefront/src/pages/blog/index.astro "apps/storefront/src/pages/produits/[category].astro" "apps/storefront/src/pages/produits/[category]/[subcategory].astro" apps/storefront/src/pages/contact.astro`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (5 corrections S regroupées)
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (SEO on-page)
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

Cinq défauts on-page résiduels de l'audit SEO du 25/06 (et de la refonte du 29/06), tous vérifiés au commit 297b7c2 : (1) les deux templates de listing les plus importants sautent un niveau de titre (H1→H3) ; (2) `/produits` et `/blog` affichent un fil d'ariane visible sans émettre son `BreadcrumbList` JSON-LD, contrairement à toutes les autres pages ; (3) les pages indexables n'envoient pas `max-image-preview:large` (pertes de visibilité images/Discover pour un site catalogue photo) ; (4) les horaires du JSON-LD `FurnitureStore` de la page contact sont codés en dur alors que les horaires visibles viennent du CMS — le drift NAP corrigé en juin peut se reproduire invisiblement ; (5) les boutons de filtre du blog sont décoratifs (aucun handler), dernier contrôle « fantôme » du site.

## Current state

1. **Saut Hn** — `produits/[category].astro:66` rend le H1, puis la section produits (`:91-107`) enchaîne directement sur les `<h3>` des cartes (`ProductCard.astro:47`) ; premier `<h2>` seulement à `:113` (« Besoin de conseils ? »). Même structure dans `[subcategory].astro` (H1 `:74`, grid `:85-99`, premier H2 `:105`). Le modèle correct existe : `produits/index.astro:155` place un `<h2>` (« Tous nos produits ») au-dessus de sa grille.
2. **BreadcrumbList manquants** — `produits/index.astro:42-46` et `blog/index.astro:38-42` rendent `<Breadcrumb …>` (composant visuel) mais n'importent pas `JsonLd` et n'émettent aucun `BreadcrumbList`. Modèle correct : `produits/[category].astro:36-44` construit `breadcrumbJsonLd` et le rend ligne 54 (`<JsonLd data={breadcrumbJsonLd} />`).
3. **Meta robots** — `Layout.astro:76` : `{noindex && <meta name="robots" content="noindex" />}` — aucune directive sur les pages indexables.
4. **Horaires contact** — `contact.astro:25-31` : les horaires **visibles** viennent de `contact?.hours` (CMS) avec fallback statique ; `contact.astro:59-78` : `openingHoursSpecification` du JSON-LD est un littéral codé en dur (Lun-Ven 09:30-12:30/14:00-19:00, Sam 09:30-19:00). Si le CMS change, seul le visible bouge.
5. **Filtres blog décoratifs** — `blog/index.astro:66-80` : quatre `<button>` statiques (« Tous les articles / Conseils sommeil / Guides produits / Actualités ») sans handler ni script ; la grille rend toujours tous les posts. Modèle de filtrage client à imiter : `ProductGrid.astro:87-118` (script vanilla + attributs `data-*`).

### Conventions du repo

- JSON-LD : toujours via `<JsonLd data={…} />` (`src/components/JsonLd.astro`, qui échappe `</script>`).
- Filtres client : script vanilla inline + attributs `data-*` (voir `ProductGrid.astro`), pas de React pour ça.
- Styles : Tailwind, classes utilitaires existantes (`text-h2 text-marine`, etc.).

## Commands you will need

| Purpose   | Command                                  | Expected on success |
|-----------|------------------------------------------|---------------------|
| Typecheck | `cd apps/storefront && npx tsc --noEmit` | exit 0              |
| Build     | `pnpm --filter @dtc/storefront build`    | exit 0              |
| Tests     | `pnpm --filter @dtc/storefront test`     | verts               |

## Scope

**In scope** :
- `apps/storefront/src/layouts/Layout.astro` (meta robots uniquement)
- `apps/storefront/src/pages/produits/[category].astro` (ajout d'un H2)
- `apps/storefront/src/pages/produits/[category]/[subcategory].astro` (ajout d'un H2)
- `apps/storefront/src/pages/produits/index.astro` (JSON-LD breadcrumb)
- `apps/storefront/src/pages/blog/index.astro` (JSON-LD breadcrumb + filtres)
- `apps/storefront/src/pages/contact.astro` (openingHoursSpecification)

**Out de scope** :
- `sameAs`/liens sociaux du footer — **bloqué sur les vraies URLs Facebook/Instagram** (à demander au propriétaire ; ne rien inventer).
- `Offer.hasMerchantReturnPolicy`/`shippingDetails` — bloqué sur les conditions commerciales réelles.
- `<lastmod>` du sitemap — nécessite de faire remonter `updated_at` (backlog).
- Tout le reste de `Layout.astro` (OG, canonical…).

## Git workflow

- Branche : `seo/onpage-batch` depuis `main`. Conventional commits (un commit par correction, 5 au total). Ne pas pousser sans instruction.

## Steps

### Step 1: H2 au-dessus des grilles catégorie/sous-catégorie

Dans `[category].astro`, au début de la `<section>` produits (avant `<ProductGrid …>`), ajouter un H2 dans le conteneur existant :

```astro
<h2 class="text-h2 text-marine mb-8">Nos {currentCategory.name.toLowerCase()}</h2>
```

Idem dans `[subcategory].astro` avec `currentSubcategory.name`. (S'inspirer du H2 de `produits/index.astro:155` pour les classes exactes utilisées dans ce fichier.)

**Verify**: `pnpm --filter @dtc/storefront build` → exit 0. Hiérarchie sur une page catégorie rendue : H1 → H2 → H3 (vérifiable en dev via l'inspecteur ou `curl -s <page> | grep -o '<h[1-3]'`).

### Step 2: BreadcrumbList JSON-LD sur les deux pages index

Dans `produits/index.astro` : importer `JsonLd`, construire (modèle : `[category].astro:36-44`) :

```ts
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: new URL('/', Astro.site).href },
    { '@type': 'ListItem', position: 2, name: 'Produits' },
  ],
};
```

et rendre `<JsonLd data={breadcrumbJsonLd} />` juste après `<Layout …>`. Idem dans `blog/index.astro` avec `name: 'Blog'`.

**Verify**: `curl -s localhost:4321/produits | grep -c BreadcrumbList` → ≥1 (en dev) ; build exit 0.

### Step 3: Meta robots par défaut

`Layout.astro:76`, remplacer :

```astro
{noindex && <meta name="robots" content="noindex" />}
```

par :

```astro
<meta name="robots" content={noindex ? 'noindex' : 'index, max-image-preview:large, max-snippet:-1'} />
```

**Verify**: `curl -s localhost:4321/ | grep 'name="robots"'` → `max-image-preview:large` ; `curl -s localhost:4321/commande | grep 'name="robots"'` → `noindex`.

### Step 4: Horaires JSON-LD dérivés du CMS

Dans `contact.astro`, remplacer le littéral `openingHoursSpecification` (lignes ~59-78) par une dérivation de la même source que les horaires visibles (`hours`, lignes 25-31). Le format CMS est `{ label: string; value: string }[]` en français libre (« Lundi - Vendredi » / « 9h30 - 12h30 / 14h - 19h ») — un parsing complet est fragile. Approche demandée :

1. Extraire le littéral actuel dans une constante `DEFAULT_OPENING_HOURS_SPEC` (inchangé).
2. N'émettre `openingHoursSpecification` que lorsque les horaires visibles sont **le fallback statique** (c.-à-d. `!contact?.hours?.length`) ; quand le CMS fournit des horaires, omettre la propriété du JSON-LD plutôt que d'émettre des horaires potentiellement contradictoires, et laisser un commentaire d'une ligne expliquant pourquoi (« un schema absent vaut mieux qu'un schema faux »).

**Verify**: build exit 0 ; avec le CMS vide (fallback), le JSON-LD contient les horaires ; le commentaire explicatif est présent.

### Step 5: Rendre les filtres du blog fonctionnels

Dans `blog/index.astro` :

1. Générer les boutons depuis les **catégories réellement présentes** dans les posts (`[...new Set(posts.map(p => p.category).filter(Boolean))]`), précédés d'un bouton « Tous les articles » — supprimer les libellés codés en dur.
2. Ajouter `data-blog-filter={category}` sur chaque bouton et `data-blog-card` + `data-category={post.category}` sur chaque carte de la grille.
3. Ajouter un `<script>` vanilla (modèle : `ProductGrid.astro:87-118`) : au clic, basculer la classe `hidden` des cartes non correspondantes et l'état visuel du bouton actif (classes existantes : actif `bg-marine text-white`, inactif `bg-white text-gray-700`).
4. Si `posts` n'a aucune catégorie distincte, ne pas rendre la barre de filtres du tout.

**Verify**: en dev avec backend actif : cliquer un filtre masque les autres posts ; « Tous les articles » réaffiche tout. Sans backend : build exit 0 et revue du code.

## Test plan

- Pas de nouveau test unitaire (changements de template) ; gates = build + vérifications `curl` des étapes.
- Vérification manuelle : une page catégorie (Hn), `/produits` et `/blog` (JSON-LD via view-source), `/` et `/commande` (meta robots), `/contact` (JSON-LD horaires), `/blog` (filtres cliquables).

## Done criteria

- [ ] `curl -s <page catégorie> | grep -o '<h[1-6]'` ne montre plus de saut H1→H3 (un H2 précède les H3).
- [ ] `/produits` et `/blog` émettent chacun un `BreadcrumbList` (view-source).
- [ ] Toute page indexable émet `max-image-preview:large` ; `/commande` et `/404` restent `noindex`.
- [ ] `grep -n "openingHoursSpecification" apps/storefront/src/pages/contact.astro` → la propriété n'est plus un littéral inconditionnel (garde `contact?.hours` présent).
- [ ] Les boutons de filtre du blog ont un handler (`grep -n "data-blog-filter" apps/storefront/src/pages/blog/index.astro` → ≥2 résultats : markup + script).
- [ ] `npx tsc --noEmit` et `pnpm --filter @dtc/storefront build` → exit 0.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport si :

- Les extraits « Current state » ne correspondent plus au code.
- Le champ `category` des posts s'avère absent/toujours vide en pratique **et** la barre de filtres devait être générée dynamiquement — dans ce cas appliquer le point 4 de l'étape 5 (ne pas rendre la barre) et le signaler.
- Une vérification échoue deux fois.

## Maintenance notes

- Étape 4 : le bon état final serait des horaires **structurés** dans le CMS (jours/plages typés) pour dériver les deux rendus d'une seule source — nécessite une évolution du module `cms` backend (modèle `contact`), déférée volontairement.
- Les items bloqués sur des données du propriétaire (URLs sociales pour `sameAs`, politique de retour/livraison pour l'`Offer`) sont listés dans `plans/README.md` — les débloquer ne demande que les données, pas de design.
- Si une future page ajoute un fil d'ariane visible, émettre systématiquement le `BreadcrumbList` correspondant (c'est désormais la convention partout).
