# 007 — Anciennes URL restantes : catalogue manquant et décisions éditoriales

Priorité P0 (avant le remplacement de l'ancien site) · Effort M · Dépend de : décisions catalogue du propriétaire

Suite du chantier de migration ouvert par `SEO_REVIEW_2026-09-14.md` (section « Sécuriser la
migration »). Les 21 correspondances validées sont déjà en place dans le bloc `redirects` de
`apps/storefront/astro.config.mjs`. Ce plan couvre les **12 chemins restants**, laissés en 404
pour l'instant.

Source de l'inventaire : sitemap Simplébo (33 chemins) + `/plan-du-site` de l'ancien site.
Aucun chemin supplémentaire n'a été trouvé au-delà de cet inventaire.

## Lot A — chemins qui attendent un catalogue

Le propriétaire confirme que ces familles de produits sont vendues en magasin. Elles n'existent
pas dans le catalogue Medusa actuel (4 catégories : matelas, sommiers, oreillers-couettes,
tetes-de-lit ; 5 sous-catégories ; 12 produits).

| Ancienne URL | Titre de l'ancienne page | Destination visée |
|---|---|---|
| `/relaxation-electrique-a-bruay-la-buissiere-62700` | Relaxation électrique à Bruay-la-Buissière | Catégorie ou sous-catégorie Relaxation |
| `/matelas-relaxation` | Matelas relaxation | Relaxation, volet matelas |
| `/matelas-relaxation7` | Matelas Relaxation de Qualité (doublon) | Même destination que `/matelas-relaxation` |
| `/sommiers-relaxations` | Sommiers de Relaxation Confortables | Relaxation, volet sommiers |
| `/sommiers-coffre` | Sommiers Coffre Pratiques et Élégants | Sous-catégorie Sommiers coffres |
| `/canapes-lits` | Canapés Lits Confortables | Catégorie Canapés-lits |
| `/surmatelas-synthetiques` | Surmatelas Synthétiques | Catégorie ou sous-catégorie Surmatelas |
| `/surmatelas-naturels` | Surmatelas Naturels | Idem |

**Condition d'exécution (STOP).** Ne pas créer une catégorie qui resterait vide : une page de
catégorie sans produit est moins utile qu'une 404 et affaiblit la qualité perçue du site. Pour
chaque famille ci-dessus, vérifier d'abord qu'il existe au moins deux produits réels, avec
photo et description, à y publier.

Si une famille ne peut pas être remplie, rediriger vers la catégorie parente la plus proche
plutôt que vers l'accueil :

- relaxation (matelas) → `/produits/matelas` ; relaxation (sommiers) → `/produits/sommiers`
- sommiers coffre → `/produits/sommiers`
- surmatelas → `/produits/oreillers-couettes`
- canapés-lits → aucune catégorie proche ; laisser une 404 franche

Étapes :

1. Décision produit par famille → verify : liste des produits réels arrêtée avec le propriétaire.
2. Création des catégories et sous-catégories retenues dans Medusa, puis publication des produits
   → verify : la catégorie répond en 200 et affiche au moins deux produits.
3. Ajout des redirections correspondantes dans `astro.config.mjs`
   → verify : `curl -o /dev/null -w '%{http_code} %{redirect_url}'` renvoie 301 vers la destination
   attendue pour chacun des 8 chemins.
4. Contrôle du sitemap → verify : les nouvelles catégories apparaissent dans `/sitemap.xml`.

## Lot B — décisions éditoriales, sans dépendance catalogue

| Ancienne URL | Titre de l'ancienne page | Décision retenue |
|---|---|---|
| `/bien-etre` | Bien-être avec BLEUNUIT | → `/produits` |
| `/contact-literie-bleunuit-specialiste-literie-a-bruay-la-buissiere` | À Propos de BLEUNUIT | → `/contact` |
| `/plan-du-site` | Plan du site | 404 assumée ; `/sitemap.xml` remplit ce rôle |

`/contact-literie-…` était en réalité la page « À propos » de l'ancien site. La redirection vers
`/contact` n'est satisfaisante qu'une fois cette page enrichie de l'histoire et de l'expérience du
magasin — c'est le constat P1 « Page magasin trop générique » du rapport. Exécuter ce lot de
préférence après, ou en même temps que, cet enrichissement.

Étapes :

1. Deux entrées ajoutées au bloc `redirects` → verify : 301 vers `/produits` et `/contact`.
2. `/plan-du-site` laissé sans entrée → verify : 404 avec `noindex`.

## Hors périmètre

`/mentions-legales` est traité séparément : la page a été créée à la même adresse que sur
l'ancien site, aucune redirection n'est donc nécessaire.
