# Revue SEO du nouveau site Literie Bleu Nuit

Audit du 14 septembre 2026 — code de référence : `4913578`.

**Conclusion : le nouveau site dispose déjà d'une bonne base technique. Les priorités sont la fiabilité des informations du magasin, la préparation de la migration, puis des pages locales et commerciales plus utiles.** Ajouter davantage de balises génériques serait moins intéressant que ces chantiers.

Ce document est un rapport d'audit et de recommandations, pas un lot de changements déjà implémentés. Aucun code applicatif n'a été modifié pour cet audit.

## Périmètre et degré de certitude

- Site audité : le projet Astro/Medusa de ce dépôt. Le propriétaire a confirmé que `https://bleunuit.fr` est l'ancien site.
- L'ancien site Simplébo a seulement servi à retrouver des URL et des informations publiques utiles à la migration. Ses défauts ne sont pas attribués au nouveau site.
- Revue des routes, titres, descriptions, canonicals, robots, sitemap, redirections, liens internes, données structurées, images, modèles CMS et possibilités éditoriales.
- Vérification des audits précédents et des plans 001–006, déjà marqués terminés. Les problèmes effectivement corrigés ne sont pas présentés comme restant à résoudre.
- Sans URL de prévisualisation du nouveau site ni accès au contenu Medusa déployé, les données de seed ne prouvent pas l'état du catalogue réel. Les cas conditionnels sont indiqués.
- Pas d'accès à Search Console, aux statistiques de la fiche Google, aux journaux serveur ni aux conversions. Pas de mesure Lighthouse/CrUX du nouveau site, de crawl complet de ses pages rendues, de classement local géolocalisé, de volumes de mots-clés ou d'audit exhaustif des backlinks.
- Les modifications concurrentes du propriétaire dans le backend ne font pas partie de cet audit.

Vérifications exécutées : `pnpm --filter @dtc/storefront test` → **14 tests réussis, 3 fichiers** ; `pnpm --filter @dtc/storefront typecheck` → **réussi**. Ces contrôles ne valident ni le SEO rendu ni les templates Astro comme le ferait une vérification dédiée. Aucun build ni déploiement effectué.

## Ce qui est déjà bien en place

| Élément | Preuve dans le nouveau site | Appréciation |
|---|---|---|
| Contenu principal rendu côté serveur | `apps/storefront/astro.config.mjs:18`, routes Astro | Bonne base pour rendre catalogue et contenu accessibles aux moteurs. |
| Titre de l'accueil localisé | `apps/storefront/src/pages/index.astro:204` | « Matelas & sommiers à Bruay-la-Buissière », suffixe de marque ajouté par le layout. |
| Balises communes | `apps/storefront/src/layouts/Layout.astro:70` | Description, canonical, langue française, Open Graph, aperçu d'image autorisé. |
| Robots et sitemap | `apps/storefront/src/pages/robots.txt.ts:3`, `sitemap.xml.ts:10` | Présents ; leurs valeurs finales dépendent du domaine configuré. |
| Erreurs et pages privées du parcours | `apps/storefront/src/pages/404.astro:7`, `commande.astro:8` | Vraie réponse 404 prévue ; 404 et commande portent `noindex`. |
| Structure de navigation | `apps/storefront/src/components/Header.astro:31`, `Breadcrumb.astro:25` | Liens HTML vers catégories et sous-catégories, fil d'Ariane visible. |
| Données structurées | `Layout.astro:42`, `contact.astro:64`, routes produits et blog | Organization, WebSite, FurnitureStore, Product, BlogPosting et plusieurs BreadcrumbList. Présence ne signifie pas validation Google complète. |
| Premières optimisations de chargement | `index.astro:213`, `Layout.astro:2`, `utils/http-cache.ts:4` | Variantes de l'image d'accueil locale, police auto-hébergée, cache HTTP prévu et images différées sous la ligne de flottaison. |

La page `/magasins` redirigée vers `/contact` est un choix cohérent pour un seul magasin. Le mode vitrine/devis des produits est également intentionnel.

## Constats prioritaires

P0 = à traiter avant le remplacement de l'ancien site ; P1 = fort intérêt au lancement ; P2 = amélioration secondaire ou conditionnelle. Effort : S = quelques heures, M = environ 1–2 jours, L = plusieurs jours, hors délai de collecte des informations commerciales. L'impact décrit est potentiel, pas un gain de trafic mesuré.

| Priorité | Constat et impact | Effort | Risque du changement | Confiance | Preuve |
|---|---|---|---|---|---|
| P0 | **Migration des anciennes URL non couverte dans le dépôt.** Une mise en ligne directe perdrait les chemins connus des visiteurs et des liens entrants. | M | Moyen : chaque destination doit répondre à la même intention | Haute sur l'absence dans le dépôt ; proxy non audité | Routes de `apps/storefront/src/pages/`, `astro.config.mjs:14`, inventaire en annexe |
| P0 | **Coordonnées du magasin réparties entre quatre sources.** Une correction dans Contact ne corrige pas automatiquement footer et balisage. | M | Moyen : réconcilier les données existantes | Haute sur le code | `contact.astro:18` et `:64`, `Footer.astro:21` et `:57`, `Layout.astro:50` |
| P1 | **Page magasin trop générique.** `/contact` expose peu l'accès et l'essai, sans bouton itinéraire. | S–M | Faible | Haute | `contact.astro:93`, `:108`, `:239` ; modèle Store `:18` et `:21` |
| P1 | **Catégories peu outillées pour un contenu différenciant.** Le template repose sur une description, la grille et un CTA générique. | M | Faible | Haute sur le template ; textes réels inconnus | `produits/[category].astro:49`, `:77`, `:98`, `:118` |
| P1 | **Images produits non redimensionnées.** Le mobile peut recevoir les fichiers d'origine. | M | Moyen : conserver des images accessibles et stables | Haute sur le code ; ralentissement non mesuré | `utils/product-card.ts:7`, `components/ProductCard.astro:22` |
| P1 | **Témoignage de secours persistant.** Dépublier tous les avis fait apparaître un avis nominatif codé en dur. | S | Faible | Haute sur le comportement ; authenticité non évaluée | `index.astro:119`, `:639` |
| P1 | **Publication d'articles incomplets possible.** Date, auteur et contenu facultatifs, nouvel article publié par défaut. | M | Moyen : préserver les brouillons et articles existants | Haute sur la possibilité | `apps/backend/src/api/admin/cms/blog-posts/validators.ts:3`, `admin/routes/content/blog/page.tsx:50` |
| P2 | **Dates structurées artificielles.** Échéance de prix automatiquement repoussée ; date de modification d'article égale à sa publication. | S–M | Faible | Haute | `produits/[category]/p/[slug].astro:75`, `blog/[slug].astro:59` |
| P2 | **Slash final non normalisé dans l'application.** Risque de canonicals différents pour un même contenu. | S | Faible | Haute sur le code ; HTTP du nouveau site à tester | `astro.config.mjs:14`, `Layout.astro:36` |
| P2 | **Galerie produit jamais alimentée.** Les photos supplémentaires de Medusa ne remontent pas. | S–M | Faible | Haute | `utils/catalog-client.ts:165` |
| P2 | **Maillage guides → catalogue à compléter.** Le template propose des articles similaires et Contact ; les guides de seed ne contiennent aucun lien contextuel. | S–M | Faible | Haute sur template/seed ; CMS réel inconnu | `blog/[slug].astro:134`, `:158`, `:208`, `apps/backend/src/scripts/data/cms-content.ts:16` |
| P2 | **Réseaux sociaux inactifs.** Les deux liens du footer pointent sur `#`. | S | Faible | Haute | `Footer.astro:70`, `:76` |
| P2 | **Certains produits peuvent manquer dans leur catégorie parente.** Cas des produits rattachés seulement à une sous-catégorie. | S–M | Faible | Haute sur le cas ; occurrence réelle inconnue | `utils/catalog-client.ts:145`, `:274`, `:292` |
| P2 | **Limite de 200 produits sans pagination exhaustive.** Le sitemap et les listes deviendraient incomplets au-delà du seuil. | M | Moyen : ne pas charger tout le catalogue à chaque visite | Haute, risque futur | `utils/catalog-client.ts:195`, `:253`, `sitemap.xml.ts:18` |
| P2 | **Dates de modification absentes du sitemap.** Signal utile manquant, sans blocage d'indexation. | M | Faible | Haute | `sitemap.xml.ts:51` ; déjà au backlog de `plans/README.md` |
| P2 | **Libellés de blog incomplets.** La catégorie « conseils » proposée par le CMS n'a pas de libellé dans les badges. | S | Faible | Haute sur le cas | `admin/routes/content/blog/page.tsx:38`, `blog/index.astro:141`, `blog/[slug].astro:100` |

Les preuves sans préfixe complet dans ce tableau sont relatives à `apps/storefront/src/`, sauf `astro.config.mjs` relatif à `apps/storefront/` et les fichiers d'administration relatifs à `apps/backend/src/`.

### 1. Sécuriser la migration

Le [sitemap public de l'ancien site](https://www.bleunuit.fr/sitemap.xml), récupéré le jour de l'audit, contient **34 entrées correspondant à 33 chemins uniques** après normalisation de l'accueil. Il annonce notamment `/produits-simmons`, `/produits-latex` et `/sommiers-coffre`. Les redirections existantes du nouveau projet gèrent `/magasins` et des variantes de catégories internes, pas ces anciennes URL Simplébo.

Conserver une ancienne URL pertinente est possible. Si elle change, établir une correspondance vers son équivalent et une redirection permanente directe. Ne pas renvoyer tous les anciens produits vers l'accueil. Compléter l'inventaire avec Search Console, les liens entrants et les pages hors sitemap ; conserver les redirections au moins un an, idéalement durablement. [Recommandations Google pour les migrations](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

Exemples de décisions à prendre, **pas des destinations déjà validées** :

| Ancienne URL | Destination sémantique à préserver |
|---|---|
| `/sommier-a-bruay-la-buissiere-62700` | Catégorie Sommiers du nouveau catalogue |
| `/produits-simmons` | Sélection Simmons réellement proposée, avec contenu conservé ou réécrit |
| `/produits-latex` | Sélection latex Dunlopillo correspondante |
| `/sommiers-coffre` | Sous-catégorie sommiers coffres |
| `/contact-literie-bleunuit-specialiste-literie-a-bruay-la-buissiere` | Page qui reprend l'histoire et les informations du magasin ; `/contact` seulement si son contenu est enrichi en conséquence |

Le maintien du domaine ne nécessite pas de demande de changement d'adresse Search Console pour de simples changements de chemins. Conserver la propriété et sa méthode de validation. Tester aussi HTTP/HTTPS, www/sans www, les canonicals et les paramètres de suivi sur le nouveau déploiement.

### 2. Une seule fiche fiable pour le magasin

Le nouveau footer indique une adresse générique au centre commercial et le téléphone `03 21 53 21 45`. La fiche Store du seed contient encore une autre adresse et un téléphone de démonstration. L'ancien site expose quant à lui **183 rue des Frères Lumière, Zone Porte Nord**, le **03 21 57 98 71** et `bruay@bleunuit.fr`. Ce sont des **écarts à réconcilier**, pas une confirmation que toutes les informations anciennes sont encore exactes. Source de comparaison : [ancien site public](https://www.bleunuit.fr/).

Choisir les coordonnées réelles avec le propriétaire puis les utiliser dans Contact, footer, Organization et FurnitureStore. Ne pas se contenter de corriger le seed : `seed-cms.ts:112` et `:144` ignorent les collections déjà remplies.

Les horaires doivent suivre la même logique. Le code évite déjà d'émettre des horaires structurés contradictoires lorsque le CMS fournit des horaires libres. Une évolution utile serait un format structuré unique produisant texte visible et JSON-LD. Ajouter un identifiant stable à l'entité magasin et ses véritables liens sociaux ; cela clarifie l'identité sans garantir un gain de position. [Données structurées LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business).

Les profils suivants sont liés depuis l'ancien accueil et peuvent servir à retrouver les comptes à reprendre : [Facebook](https://www.facebook.com/profile.php?id=100075696167966) et [Instagram](https://www.instagram.com/literiebleunuitbruay/). Leur gestion et leur actualité restent à vérifier.

### 3. Renforcer les pages qui peuvent déclencher une visite

**Accueil.** Le titre SEO actuel est déjà pertinent. Le H1 de secours « Votre plus belle nuit commence en magasin » (`index.astro:38`) pourrait devenir plus explicite, tout en gardant cette phrase comme accroche : « Votre magasin de literie à Bruay-la-Buissière ». C'est une amélioration de clarté, pas une règle imposant tous les mots-clés dans chaque titre.

**Page magasin.** Garder `/contact`, remplacer son titre générique et documenter l'expérience de visite : photos authentiques, façade reconnaissable, repères d'accès, parking et accessibilité vérifiés, horaires, téléphone, itinéraire et déroulement d'un essai. Exemples éditoriaux :

- Titre : « Magasin de literie à Bruay-la-Buissière | Literie Bleunuit ».
- H1 : « Votre magasin Literie Bleu Nuit à Bruay-la-Buissière ».
- Description : « Venez essayer nos matelas et sommiers à Bruay-la-Buissière. Retrouvez les horaires, l'accès au magasin et les conseils de notre équipe. »

**Catégories.** Commencer par Matelas et Sommiers. Ajouter une courte introduction utile avant la grille et des conseils après : différences entre modèles, usages, choix, essais et services. Prévoir des champs SEO distincts de la description commerciale. Le layout ajoute déjà la marque : éviter de la répéter dans le titre transmis.

**Fiches produits.** Associer nom précis, marque, dimensions réellement proposées, caractéristiques vérifiées, photos du modèle, explication du confort et possibilité d'essai. Afficher un prix ou un « à partir de » seulement si sa variante et ses conditions sont compréhensibles. Les données du code ne permettent pas de juger la qualité de toutes les fiches finales.

### 4. Ajuster les données structurées à la vente en magasin

Les produits `in_store` n'émettent aujourd'hui ni `Offer`, ni avis produit, ni note produit. Le balisage Product peut décrire le produit, mais ne remplit pas à lui seul les conditions des extraits produits Google. Une offre réellement tarifée en magasin peut être étudiée avec une disponibilité `InStoreOnly`, sans activer le panier. Un produit sur devis sans prix fiable doit rester présenté honnêtement. La documentation distingue les extraits produits des présentations marchandes liées à l'achat en ligne. [Extraits produits et propriétés acceptées](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).

Pour les produits vendus en ligne, supprimer l'échéance artificielle du 31 décembre de l'année suivante ou la remplacer par une date commerciale réelle. Ajouter livraison et retours uniquement à partir des modalités effectives. Ne pas inventer prix, disponibilités, notes, GTIN ou politiques pour éliminer les avertissements d'un validateur.

Pour le blog, transporter une vraie date de mise à jour éditoriale, rendre les informations optionnelles proprement et représenter une équipe comme Organization si elle est l'auteur. Identifier un conseiller et son expérience peut aussi rendre les contenus plus crédibles.

### 5. Performance : terminer le travail sur les images avant une refonte

Le dossier public local pèse environ **1,4 Mo** au total ; ce n'est pas le poids d'une page téléchargée. L'image principale locale possède déjà des versions d'environ 32 Ko, 68 Ko et 136 Ko selon la largeur. Il serait incorrect de reprendre l'ancien constat « aucune optimisation d'image ».

Le chantier restant concerne surtout les images distantes : `productImageUrl()` ignore largeur, hauteur et qualité, et les cartes n'ont pas de `srcset`. Prévoir des versions adaptées à l'affichage mobile et desktop, avec compression et formats modernes lorsque l'infrastructure le permet. La galerie est actuellement forcée à `[]` ; elle doit remonter les photos disponibles dans Medusa.

Le panier React est chargé sur toutes les pages (`Layout.astro:110`, `Header.astro:154`). Mesurer son coût avant de différer son chargement. Les appels CMS du blog relisent aussi la collection complète (`utils/cms-client.ts:86`) : faible priorité tant que le blog est petit. Les en-têtes de cache SSR présents ne prouvent pas que le proxy de production les exploite.

Sur la prévisualisation, mesurer accueil, catégorie, fiche et contact sur mobile. Cibles : **LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1**, à apprécier sur les données réelles au 75e percentile lorsqu'elles existent. Un score Lighthouse isolé n'est ni le trafic SEO ni un classement. [Seuils et méthode de mesure Google](https://web.dev/articles/vitals).

## Opportunités commerciales et éditoriales

Ces pistes sont des choix de développement, distincts des corrections ci-dessus. Les requêtes sont des hypothèses d'intention adaptées au magasin ; aucun volume de recherche n'a été mesuré.

| Piste | Ancrage dans le projet | Intention à couvrir | Contenu utile et compromis | Effort |
|---|---|---|---|---|
| Une page livraison, installation et reprise | Services déjà évoqués dans `index.astro:105` | Livraison de literie autour de Bruay, reprise de l'ancien matelas | Zone desservie, étages, délais, tarifs/conditions vérifiés. Exige les modalités réelles. | M |
| Une ou deux pages de marques prioritaires | Modèle Brand existant ; logos non cliquables `index.astro:665` | Essayer un matelas Simmons/Dunlopillo à Bruay, si ces marques sont toujours vendues | Modèles exposés, différences, sélection et accès au magasin. Éviter une page vide par marque. | M |
| Trois guides écrits avec l'équipe | Blog existant ; démarche de conseil `index.astro:95` | Essai de matelas, dimensions pour deux, compatibilité matelas/sommier | Observations concrètes, photos propres, auteur, liens vers produits et conseils réciproques depuis les catégories. | M par premier lot |
| Une demande d'essai mieux préparée | CTA « Prendre rendez-vous » `index.astro:279`, formulaire général `contact.astro:126` | Préparer une visite en magasin | Motif d'essai et disponibilités souhaitées, confirmation par l'équipe. Éviter un outil de réservation complexe au départ. | S–M |

Sujets de départ proposés : « Comment essayer un matelas en magasin ? », « 140, 160 ou 180 cm : quelle taille choisir à deux ? », « Faut-il changer le sommier avec le matelas ? ». Mieux vaut quelques guides précis que des dizaines de textes interchangeables. Les conseils techniques du seed doivent être relus selon les modèles et notices des fabricants avant publication.

## Actions locales et astuces concrètes

1. **Fiabiliser la fiche Google Business Profile.** Catégorie principale la plus précise disponible, coordonnées, horaires exceptionnels, description et photos correspondant au magasin. Mesurer appels et demandes d'itinéraire. Google cite pertinence, distance et popularité comme facteurs locaux ; une page mentionnant une ville voisine ne déplace pas le magasin dans Maps. [Classement local Google](https://support.google.com/business/answer/7091?hl=fr).

2. **Demander des avis au bon moment.** Prévoir un QR code en magasin ou après la livraison, vers le lien officiel de dépôt d'avis, et solliciter un retour honnête de tous les clients. Répondre de façon personnelle. Ne pas proposer de remise contre un avis ni filtrer les clients selon leur satisfaction. [Conseils Google sur les avis](https://support.google.com/business/answer/3474122?hl=en).

3. **Montrer la réalité du magasin.** Photos de l'équipe, de la façade, des modèles en exposition et d'une installation avec les autorisations nécessaires. Une courte vidéo expliquant comment se déroule un essai peut servir à la fois sur le site et sur la fiche. L'objectif est d'aider le client à se projeter ; pas de promesse de position grâce aux métadonnées GPS des photos.

4. **Obtenir quelques liens locaux pertinents.** Vérifier les fiches revendeurs des marques réellement distribuées et les annuaires locaux sérieux. Un article municipal consacré au magasin existe déjà : c'est un élément à préserver dans l'histoire et les relations locales, pas un backlink dont la valeur aurait été mesurée ici. [Article de la ville de Bruay-la-Buissière](https://bruaylabuissiere.fr/commerce-un-showroom-de-400-m%C2%B2-bienvenue-chez-bleunuit-version-2-0/).

5. **Étudier les fiches produits locales gratuites.** Merchant Center peut présenter des produits vendus dans un magasin physique en France. Cette piste devient intéressante lorsque prix, références et disponibilité locale sont fiables et maintenus ; elle ne demande pas de transformer tous les produits en achat en ligne. Prévoir le travail de flux et de mise à jour. [Présentation officielle des fiches locales gratuites](https://support.google.com/merchants/answer/14615117?hl=en-GB).

6. **Relier les actions SEO aux visites et demandes.** Mesurer clic téléphone, itinéraire, demande de devis réussie et demande d'essai. Ajouter une attribution UTM au lien de la fiche Google dans l'outil de mesure choisi. Aucun suivi de conversion dédié n'a été identifié dans le code parcouru ; cela ne prouve pas que Search Console n'existe pas, car sa validation peut être faite dans le DNS.

## Ce qui ne mérite pas un chantier prioritaire

- Ajouter `meta keywords`, imposer une densité de mots-clés ou un nombre magique de mots à chaque page.
- Générer des pages presque identiques « literie + ville » pour toutes les communes voisines. Décrire d'abord les zones réellement desservies et les services utiles.
- Ajouter `priority` et `changefreq` au sitemap : Google les ignore. Ajouter un `lastmod` seulement s'il reflète une vraie modification. [Documentation des sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- Ajouter du balisage FAQ pour obtenir un grand encart Google : la fonctionnalité FAQ enrichie a été retirée à partir du **7 mai 2026**. Les réponses visibles aux questions clients restent utiles. [Mise à jour officielle](https://developers.google.com/search/updates).
- Attendre des étoiles SEO pour le magasin en recopiant ses propres avis Google dans LocalBusiness. Les avis auto-promotionnels d'un établissement ne sont pas éligibles à ces étoiles dans les résultats organiques ; les avis restent utiles aux visiteurs et à Maps. [Règles sur les extraits d'avis](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
- Créer un `llms.txt` pour gagner des positions dans Google ou ses réponses IA : Google indique ne pas l'utiliser à cette fin. Des informations exactes, accessibles et utiles restent la priorité. [Guide Google sur la recherche générative](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
- Réécrire le site dans un autre framework, généraliser l'e-commerce ou lancer un chantier de « crawl budget » pour quelques dizaines de pages.

## Ordre d'action proposé

| Moment | Travail | Vérification attendue |
|---|---|---|
| Avant mise en ligne | Coordonnées de référence, domaine final, inventaire et correspondance des anciennes URL, contenu magasin | Même adresse/téléphone/horaires visibles et structurés ; aucune ancienne page importante oubliée |
| Avant mise en ligne | Contrôle de la prévisualisation et des redirections, retrait des données de démonstration et témoignages non approuvés | Pages utiles en 200, inconnues en 404, migrations en 301/308 sans boucle ; préproduction protégée de l'indexation |
| Première semaine | Page magasin, catégories Matelas/Sommiers, liens sociaux, téléphone/itinéraire/devis mesurables | Texte et liens utiles sans JavaScript ; demandes reçues ; données structurées testées |
| Premier mois | Images distantes, galerie, dates structurées, premier guide et éventuellement une marque | Contrôle mobile sur les vraies pages ; informations commerciales cohérentes |
| Mois suivants | Deux autres guides, page services, liens de partenaires, éventuel flux local | Suivi mensuel des requêtes locales hors marque, contacts qualifiés et visites attribuables |

Dépendances : la fiche magasin de référence précède l'enrichissement local ; le catalogue final précède les destinations de migration et un flux Merchant Center ; des dates CMS fiables précèdent `lastmod`. Les optimisations de panier et de cache doivent suivre une mesure réelle.

Tableau de bord minimal : clics et impressions Search Console par page et requête, distinction marque/hors marque, pages indexées, erreurs 404/5xx, appels, itinéraires, devis et essais. Comparer des périodes comparables et tenir compte de la saisonnalité ; ne pas fixer de promesse de trafic sans état initial.

## Inventaire initial des chemins de l'ancien sitemap

Source : [sitemap Simplébo](https://www.bleunuit.fr/sitemap.xml), lecture HTTP du 14 septembre 2026. Cette liste sert à la migration, **pas à mesurer le nombre de pages indexées**. Les 34 entrées contiennent deux formes de l'accueil, regroupées ici en un seul chemin. Le sitemap ne remplace pas l'inventaire Search Console ni celui des liens entrants.

```text
/
/relaxation-electrique-a-bruay-la-buissiere-62700
/sommier-a-bruay-la-buissiere-62700
/contact-literie-bleunuit-specialiste-literie-a-bruay-la-buissiere
/blog
/produits-petit-prix
/produits-primo
/produits-latex
/produits-hybrid
/produits-rendez-vous
/produits-club-line
/produits-renaissance
/produits-aerial
/produits-simmons
/produits-beauty-sensory
/produits-mille-une-nuit
/cadres-lattes
/tapissiers
/sommiers-coffre
/canapes-lits
/matelas-relaxation
/matelas-relaxation7
/sommiers-relaxations
/cadres-lattes6
/bien-etre
/tissus
/bois
/oreillers-synthetiques
/oreillers-naturels
/couettes-synthetiques
/couettes-naturelles
/surmatelas-synthetiques
/surmatelas-naturels
```

L'ancien accueil lie également `/mentions-legales` et `/plan-du-site`, absents de cet inventaire XML. Les intégrer à la décision de reprise. Leur mention ici est un constat de migration, pas un audit juridique.

## Constats anciens écartés ou nuancés

- Soft 404 systématiques : correction présente dans le nouveau code.
- Organization/WebSite absents : désormais présents.
- BreadcrumbList des sous-catégories non rendu : désormais rendu.
- Images du blog ignorées : le champ `featured_image` est exploité.
- Aucun cache SSR ou aucune optimisation locale d'image : déjà corrigé partiellement ; impact en production à mesurer.
- Filtres du blog complètement inopérants : le filtre possède un fallback ; seul le libellé de certains badges reste à fiabiliser.
- Offre obligatoire pour chaque produit sur devis : rejeté. Le référencement doit représenter le mode de vente réel.
- Anciennes coordonnées supposées exactes parce qu'elles figurent en ligne : rejeté. Seules les informations commerciales confirmées doivent être reprises.

Les plans 001–006 restent des historiques de corrections. Ce rapport complète leur backlog sans remettre leurs statuts à zéro et sans créer de nouveaux plans d'implémentation non sélectionnés.
