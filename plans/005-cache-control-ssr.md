# Plan 005: Ajouter des en-têtes Cache-Control aux pages SSR stables

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 297b7c2..HEAD -- apps/storefront/src/pages apps/storefront/src/utils/http-cache.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (staleness si TTL mal réglé ; voir « Maintenance notes »)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `297b7c2`, 2026-07-07

## Why this matters

Toutes les pages sont SSR (`output: 'server'`) et seul le sitemap envoie un `Cache-Control` (`sitemap.xml.ts:57`). Chaque hit — y compris les crawlers — paie donc un rendu complet plus la rafale d'appels Medusa. Un `Cache-Control` avec `s-maxage` + `stale-while-revalidate` permet à un CDN/proxy devant le conteneur Node (déploiement Docker, voir `DEPLOY.md`) d'absorber la majorité du trafic, et améliore le TTFB perçu par Google. Sans CDN devant, l'en-tête est inoffensif et prêt pour le jour où il y en a un.

## Current state

- `apps/storefront/src/pages/sitemap.xml.ts:54-59` — seul exemple existant du pattern :
  ```ts
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
  ```
- `robots.txt.ts` ne pose que `Content-Type`.
- Aucune page `.astro` ne touche `Astro.response.headers`.
- Pages du site (toutes SSR) : `index.astro`, `produits/index.astro`, `produits/[category].astro`, `produits/[category]/[subcategory].astro`, `produits/[category]/p/[slug].astro`, `blog/index.astro`, `blog/[slug].astro`, `contact.astro`, `magasins.astro` (stub 301 vers /contact), `commande.astro` (checkout, `noindex`), `404.astro`.
- Dans une page Astro SSR, l'API est : `Astro.response.headers.set('Cache-Control', '…')` dans le frontmatter.
- Le panier/checkout est **entièrement client-side** (React islands + localStorage, cf. `stores/cart.ts`) : le HTML des pages catalogue ne contient aucun état utilisateur — il est donc cacheable sans risque de fuite entre visiteurs. `commande.astro` reste non caché par prudence.

## Commands you will need

| Purpose   | Command                                                          | Expected on success |
|-----------|------------------------------------------------------------------|---------------------|
| Typecheck | `cd apps/storefront && npx tsc --noEmit`                         | exit 0              |
| Build     | `pnpm --filter @dtc/storefront build`                            | exit 0              |
| Runtime   | `curl -sI localhost:4321/ \| grep -i cache-control` (dev ou preview) | l'en-tête attendu   |

## Scope

**In scope** :
- `apps/storefront/src/utils/http-cache.ts` (à créer)
- Frontmatter des pages : `index.astro`, `produits/index.astro`, `produits/[category].astro`, `produits/[category]/[subcategory].astro`, `produits/[category]/p/[slug].astro`, `blog/index.astro`, `blog/[slug].astro`, `contact.astro`
- `apps/storefront/src/pages/robots.txt.ts` (ajout du même en-tête que le sitemap)

**Out of scope** :
- `commande.astro`, `404.astro`, `src/pages/api/**` (contact/newsletter — POST, jamais cacher).
- `magasins.astro` (301 stub).
- `sitemap.xml.ts` (déjà correct).
- Toute infrastructure CDN (hors repo).

## Git workflow

- Branche : `perf/ssr-cache-control` depuis `main`. Conventional commits. Ne pas pousser sans instruction.

## Steps

### Step 1: Helper partagé

Créer `apps/storefront/src/utils/http-cache.ts` :

```ts
// Cache-Control des pages SSR publiques. `s-maxage` cible le CDN/proxy devant
// le conteneur Node ; les navigateurs restent à 0 (le HTML change avec le
// catalogue). stale-while-revalidate évite les misses bloquants.
const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

export function setPageCacheHeader(response: Response): void {
  response.headers.set('Cache-Control', PAGE_CACHE_CONTROL);
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Appliquer aux pages listées

Dans le frontmatter de chacune des 8 pages in-scope, après les fetchs et **avant tout `return` de redirection/rewrite** — poser l'en-tête seulement sur le chemin de rendu nominal (pas sur les 301/404). Exemple pour `[category].astro` (placer l'appel après le bloc de redirection ligne 24-26) :

```ts
import { setPageCacheHeader } from '../../utils/http-cache';
// … fetchs et redirections existants …
setPageCacheHeader(Astro.response);
```

**Verify**: `npx tsc --noEmit` → exit 0 ; `pnpm --filter @dtc/storefront build` → exit 0.

### Step 3: robots.txt

Ajouter `'Cache-Control': 'public, max-age=3600'` aux headers de la réponse de `robots.txt.ts` (même valeur que le sitemap).

**Verify**: `grep -n "Cache-Control" apps/storefront/src/pages/robots.txt.ts` → 1 résultat.

### Step 4: Vérification runtime

Lancer `pnpm --filter @dtc/storefront build && pnpm --filter @dtc/storefront preview` (ou `dev`), puis :

```bash
curl -sI localhost:4321/ | grep -i cache-control          # → s-maxage=300…
curl -sI localhost:4321/commande | grep -i cache-control  # → AUCUN en-tête cache
```

**Verify**: les deux résultats ci-dessus. (`preview` n'est pas supporté par l'adaptateur node → utiliser `node dist/server/entry.mjs` si besoin, ou `astro dev`.)

## Test plan

- Pas de test unitaire (une constante + un set d'en-tête) ; la vérification runtime de l'étape 4 est le gate.

## Done criteria

- [ ] `grep -rln "setPageCacheHeader" apps/storefront/src/pages` → exactement les 8 pages in-scope.
- [ ] `curl -sI` sur `/` et une page catalogue montre `s-maxage=300, stale-while-revalidate=3600`.
- [ ] `/commande` ne renvoie aucun `Cache-Control`.
- [ ] `npx tsc --noEmit` et `pnpm --filter @dtc/storefront build` → exit 0.
- [ ] Aucun fichier hors scope modifié (`git status`).
- [ ] Ligne de statut mise à jour dans `plans/README.md`.

## STOP conditions

Stop et rapport si :

- Une page in-scope contient du contenu dépendant de l'utilisateur rendu côté serveur (cookie/session lu dans le frontmatter) — il n'y en a pas au commit 297b7c2, mais si ça a changé, cacher cette page fuiterait un état entre visiteurs.
- `Astro.response.headers.set` n'a pas d'effet observable en preview/dev après deux tentatives (vérifier alors avec le build standalone `node dist/server/entry.mjs`).

## Maintenance notes

- **Réglage** : 300 s de `s-maxage` = un changement de prix/stock peut mettre jusqu'à 5 min à apparaître derrière un CDN. Si le marchand édite souvent, réduire à 60 s. C'est le seul risque réel de ce plan.
- Si une page devient personnalisée côté serveur (login, prix par client), retirer `setPageCacheHeader` de cette page.
- L'en-tête n'a d'effet que derrière un proxy honorant `s-maxage` (Cloudflare, Varnish, etc.) — vérifier la topologie de déploiement dans `DEPLOY.md` au moment de la mise en prod ; le documenter là-bas serait un plus (hors scope ici).
