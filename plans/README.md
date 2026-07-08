# Implementation Plans

Générés par le skill `improve` le 2026-07-07 (audit structure / performance / SEO, commit `297b7c2`).
Session non interactive : les plans couvrent les 6 constats à plus fort levier par défaut.
Exécuter dans l'ordre ci-dessous sauf contrainte de dépendance. Chaque exécuteur : lire le plan
en entier avant de commencer, respecter ses STOP conditions, mettre à jour sa ligne de statut.

Audits antérieurs de référence : `PROJECT_REVIEW.md` (2026-06-19, sécurité/stabilité) et
`SEO_AUDIT.md` (2026-06-25, SEO + journaux d'implémentation). Le présent audit a vérifié leur
statut au commit `297b7c2` — voir « Findings vérifiés » plus bas.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001  | Produits sans catégorie parente : sitemap, liens, canonical | P1 | M | — | DONE |
| 002  | Baseline de vérification : typecheck, tests backend, CI | P1 | M | 001 | DONE |
| 003  | Couche catalogue : mémoïsation TTL + requêtes ciblées | P1 | M | 001 | DONE |
| 004  | Images locales : poids, formats, orphelins, placeholder local | P2 | M | — (conflit doux avec 001 sur `product-card.ts`) | DONE |
| 005  | Cache-Control sur les pages SSR stables | P2 | S | — | TODO |
| 006  | Lot SEO on-page : Hn, BreadcrumbList, robots, horaires, filtres blog | P2 | M | — | TODO |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (avec raison) | REJECTED (avec justification)

## Dependency notes

- **002 requiert 001** : le gate `tsc --noEmit` du storefront ne peut passer au vert qu'une fois les 2 erreurs de `sitemap.xml.ts` corrigées (elles SONT le bug du plan 001).
- **003 requiert 001** : les deux modifient `catalog-client.ts` (001 change `PRODUCT_FIELDS` et `toProduct`) ; exécuter séquentiellement pour éviter les conflits.
- **004** touche `product-card.ts` (placeholder) que 001 modifie aussi — exécuter après 001, ou rebaser.
- 005 et 006 sont indépendants de tout.

## Backlog (constats vérifiés, non planifiés — par ordre de valeur décroissante)

- **Galerie produit morte** : `catalog-client.ts:154` fige `gallery: []` et `PRODUCT_FIELDS` ne demande jamais la relation `images` de Medusa → la bande de vignettes de la page produit (`p/[slug].astro:155-178`) ne s'affiche jamais. Fix : ajouter `images.url` aux champs et mapper. Effort S-M. (À planifier dès que le catalogue a de vraies photos multiples.)
- **Redimensionnement des images produits distantes** : `productImageUrl()` (`product-card.ts:7-14`) est un no-op assumé — les images Medusa sont servies à leur taille d'upload. Débloquer exige une infra de transformation (CDN images ou presets à l'upload sur R2). Décision infra avant plan.
- **React hydraté sur 100 % des pages pour le panier** : `Layout.astro:110` (`CartDrawer client:only`) + `Header.astro:154` (`CartButton client:only`). Gain réel à mesurer sur bundle buildé avant de changer l'UX du panier (badge vanilla + îlot différé). Effort M, risque MED.
- **`<lastmod>` absent du sitemap** : demande de faire remonter `updated_at` produits/catégories/posts à travers les mappers. Effort M.
- **Extraction `CategoryCard.astro`** : la tuile catégorie (photo + gradient + chip « Explorer ») est dupliquée entre `index.astro:359-424` et `produits/index.astro:89-144`, avec `categoryTints` copié aux deux endroits ; les grilles « vedette »/« similaires » re-codent le markup de `ProductGrid`. À faire au prochain chantier UI.
- **Double mécanisme d'images de catégorie** : `category-image.ts:5-15` (map slug→fichier codée en dur) vs `Category.image` CMS (`catalog-client.ts:117`). La priorité est documentée, mais le map épingle du contenu marchand dans le code. Fix propre = backfill de `metadata.image` dans Medusa puis réduction du map — nécessite une action du marchand.
- **`cms-client.ts` mêmes patterns de re-fetch** que le catalogue (`getBlogPostBySlug` télécharge tous les posts avec leur contenu intégral) — collections minuscules aujourd'hui, appliquer le pattern `memoizeTtl` du plan 003 si le blog grossit.

## Bloqué sur des données du propriétaire (aucun code à écrire tant que les données manquent)

- **`sameAs` + liens sociaux du footer** : `Footer.astro:70,76` pointent sur `#` ; l'Organization JSON-LD (`Layout.astro:42-58`) n'a pas de `sameAs`. Il faut les vraies URLs Facebook/Instagram.
- **`Offer.hasMerchantReturnPolicy` / `shippingDetails`** (`p/[slug].astro:87-98`) : il faut la politique de retour et les tarifs de livraison réels (déjà noté dans SEO_AUDIT.md).

## Findings considered and rejected

- **Indexes sur les modèles CMS backend** (`blog_post`/`testimonial`/`brand` filtrent sur `published`/`rank` sans index) : collections de taille seed, gain nul aujourd'hui — re-évaluer si le CMS dépasse ~1 000 lignes.
- **`magasins.astro`** : stub 301 vers `/contact`, délibéré et documenté — pas un problème.
- **`saleMode()` propriétaire unique, Redis optionnel en dev, erreurs avalées du sitemap/cart** : tradeoffs documentés (CONTEXT.md / commentaires explicites) — pas des findings.
- **`@types/react` en `dependencies` du storefront + override racine 19.0.5 vs déclaration ^19.2.7** : incohérence cosmétique sans effet runtime ; le skew React 18/19 du backend est déjà suivi dans `PROJECT_REVIEW.md`.
- **Filtres marque/tri « décoratifs »** (finding SEO_AUDIT §5) : **résolu** depuis — `ProductGrid.astro:87-118` les câble réellement côté client. Idem : 404 réel, Organization/WebSite JSON-LD, fonts auto-hébergées, favicons/manifest, formulaires Resend, images du blog, cohérence NAP visible, titre homepage — tous vérifiés tenus au commit `297b7c2` malgré les refontes du 29/06.
- **Sécurité** : hors périmètre de cet audit (structure/perf/SEO). Les items sécurité restants de `PROJECT_REVIEW.md` (rate-limit devis, Redis en prod, bornes zod) restent suivis là-bas.
