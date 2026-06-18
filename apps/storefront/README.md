# Bleu Nuit — Storefront (Astro)

Site vitrine de **Literie Bleu Nuit**. Astro en SSR (adaptateur Node standalone),
packagé comme `@dtc/storefront` dans le monorepo pnpm + turbo `medusa/`, aux côtés
du backend Medusa (`@dtc/backend`). **Tout le contenu et le catalogue proviennent
de Medusa.**

## Stack

- **[Astro](https://astro.build/)** — SSR (`@astrojs/node`, mode standalone)
- **[React](https://react.dev/)** — composants interactifs (panier, checkout)
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[@medusajs/js-sdk](https://docs.medusajs.com/)** — lecture du contenu, du catalogue et du panier/checkout

## Place dans le monorepo

Ce package vit dans `medusa/apps/storefront`. Les commandes se lancent **depuis la
racine `medusa/`** (pnpm, pas npm) :

| Commande | Action |
|----------|--------|
| `pnpm install` | Installe les dépendances de tout le workspace |
| `pnpm storefront:dev` | Lance le storefront seul sur `http://localhost:4321` |
| `pnpm dev` | Lance backend + storefront ensemble (turbo) |
| `pnpm build` | Build de production de tous les apps |
| `pnpm --filter @dtc/storefront <dev\|build\|preview>` | Cible uniquement ce package |

## Variables d'environnement

Dans `apps/storefront/.env` (voir `.env.example`). Astro inline les variables
`PUBLIC_*` **au build**.

- `PUBLIC_MEDUSA_URL` — URL du backend Medusa (ex. `http://localhost:9000`)
- `PUBLIC_MEDUSA_PUBLISHABLE_KEY` — clé publishable Medusa
- `PUBLIC_MEDUSA_REGION_ID` — région utilisée pour le calcul des prix
- `PUBLIC_SITE_URL` — domaine public (URLs canoniques, sitemap, robots)
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` *(optionnel)* — checkout Stripe

## Données (Medusa)

- **Contenu éditorial** (accueil, blog, magasins, témoignages, marques) → routes
  `/store/cms/*` via `src/utils/cms-client.ts`.
- **Catalogue** (catégories, produits) → produits/catégories natifs Medusa via
  `src/utils/catalog-client.ts`.
- SDK + clé publishable centralisés dans `src/utils/medusa.ts`.

L'édition se fait dans l'**admin Medusa** (`http://localhost:9000/app`) : groupe
« Contenu » pour l'éditorial, sections natives Products/Categories pour le catalogue.

## Structure du projet

```
src/
├── components/   # UI Astro + composants React (panier / checkout)
├── layouts/
├── pages/        # routing automatique
│   ├── index.astro                       # accueil
│   ├── contact.astro
│   ├── produits/
│   │   ├── index.astro                   # catalogue
│   │   ├── [category].astro
│   │   └── [category]/
│   │       ├── [subcategory].astro
│   │       └── p/[slug].astro            # détail produit
│   ├── magasins.astro
│   └── blog/{index,[slug]}.astro
├── stores/       # état du panier (nanostores)
├── utils/        # cms-client.ts, catalog-client.ts, medusa.ts, product-card.ts
└── styles/
public/           # assets statiques (images, favicon)
astro.config.mjs
```

## Pages disponibles

- `/` — accueil (produits en vedette, témoignages, marques)
- `/produits` — catalogue ; `/produits/[category]`, `/produits/[category]/[subcategory]`
- `/produits/[category]/p/[slug]` — détail produit
- `/magasins` — points de vente
- `/blog`, `/blog/[slug]` — articles
- `/contact`

## Déploiement (Docker)

Image SSR construite **depuis la racine du monorepo** (le build a besoin du lockfile
pnpm racine). Voir l'en-tête de `apps/storefront/Dockerfile` :

```bash
docker build -f apps/storefront/Dockerfile -t bleunuit-storefront \
  --build-arg PUBLIC_MEDUSA_URL=https://votre-medusa \
  --build-arg PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx \
  --build-arg PUBLIC_MEDUSA_REGION_ID=reg_xxx \
  --build-arg PUBLIC_SITE_URL=https://www.bleunuit.fr \
  .
docker run -p 4321:4321 bleunuit-storefront
```

## Documentation

- [Astro](https://docs.astro.build) · [Medusa](https://docs.medusajs.com) · [Tailwind CSS](https://tailwindcss.com/docs)

---

**Développé avec ❤️ pour Literie Bleu Nuit**
