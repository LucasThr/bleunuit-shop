# 008 — Admin « Contenu » : ergonomie éditoriale (upload d'images, éditeur riche, page article)

Priorité P2 · Effort L (4 lots indépendants de taille S à M) · Dépend de : rien

Statut : en cours (lots A et C implémentés)

## Constat

L'admin Medusa est un dashboard e-commerce générique. Le groupe « Contenu » (`apps/backend/src/admin/routes/content/*`)
repose sur un composant CRUD maison (`apps/backend/src/admin/components/crud-resource.tsx`) qui rend
chaque champ comme un `Input` ou un `Textarea` brut. Pour une personne non technique, les frictions
sont concrètes :

| Friction | Où | Impact |
|---|---|---|
| Le corps d'un article est un `<Textarea>` de HTML brut (`content`, label « Contenu (HTML) ») | `routes/content/blog/page.tsx:47` | Impossible d'écrire un article sans connaître le HTML |
| Toutes les images sont des champs « URL » à coller à la main | blog `featured_image`, marques `logo`, magasins `image`, homepage `hero_image` | Il faut héberger l'image ailleurs, puis copier l'adresse |
| La date de publication est un texte libre au format `2024-10-02` | `routes/content/blog/page.tsx:41` | Format non validé ; une faute de frappe casse le tri `publish_date DESC` du backend |
| La catégorie du blog est un texte libre | `routes/content/blog/page.tsx:37` | Le storefront ne connaît que 3 clés (`sleep-tips`, `product-guides`, `company-news` dans `blog/index.astro:23`) ; toute autre valeur s'affiche brute, sans libellé |
| Le slug est saisi à la main | `routes/content/blog/page.tsx:32` | Risque d'espaces, majuscules, accents ; pas d'unicité vérifiée |
| L'édition se fait dans un `Drawer` étroit, la création dans un `FocusModal` | `crud-resource.tsx:388-460` | Éditer un article long dans un tiroir de 400 px est pénible ; incohérent entre créer et modifier |
| Aucun lien vers la page publique | — | L'éditeur ne voit jamais le résultat |

Ce qui est déjà en place et sur quoi s'appuyer :

- **Upload de fichiers natif** : `POST /admin/uploads` via `sdk.admin.upload.create({ files: [File] })`
  (`@medusajs/js-sdk` 2.15.5). Le provider de fichiers est configuré : disque local en dev,
  S3-compatible en production (`medusa-config.ts:51-70`). Les images produit passent déjà par là.
- **Composants `@medusajs/ui` 4.1.15** disponibles et non utilisés ici : `DatePicker`, `Select`, `Tooltip`.
- **Sanitisation côté storefront** (`apps/storefront/src/utils/sanitize.ts`) : allowlist
  `sanitize-html` par défaut + `img`, `figure`, `figcaption` ; attributs `class` partout,
  `href/target/rel` sur `a`, `src/alt/title/width/height/loading` sur `img`. Le rendu passe par
  `@tailwindcss/typography` (`prose`). Tout HTML produit par l'éditeur doit rester dans cette allowlist.
- **API blog** : `GET/POST /admin/cms/blog-posts`, `GET/POST/DELETE /admin/cms/blog-posts/:id`,
  validée par zod (`api/admin/cms/blog-posts/validators.ts`). `slug` et `category` sont des `z.string()`
  sans contrainte.

## Objectif

Rendre le groupe « Contenu » utilisable sans compétence technique, sans sortir de la coquille
admin Medusa (sidebar, thème, auth) : on ne forke pas `@medusajs/dashboard`, on n'ajoute pas de
second back-office.

## Hors périmètre

- Refonte visuelle globale de l'admin (thème, sidebar) : Medusa ne l'expose pas ; le branding
  existant (logo de connexion, libellés FR) suffit.
- Fiches produit : natif Medusa, non malléable au-delà des widgets. Un widget « description riche »
  est une extension possible du lot B, listée en fin de plan, non incluse.
- Brouillon / prévisualisation d'un article non publié côté Astro (draft mode). Le lien « Voir sur le
  site » du lot D ne fonctionne que pour un article `published: true`.
- Migration du HTML existant des articles : l'éditeur doit charger tel quel le HTML actuel (lot B,
  critère de vérification), aucune conversion de données.

## Ordre d'exécution recommandé

Les quatre lots sont indépendants fonctionnellement. Ordre par rapport gain / effort :

1. **Lot A — champ image avec upload** (S). Touche 4 écrans d'un coup.
2. **Lot C — champs typés : date, catégorie, slug** (S). Blog uniquement, zéro dépendance.
3. **Lot B — éditeur riche pour `content`** (M). Ajoute une dépendance.
4. **Lot D — page article dédiée + lien « Voir sur le site »** (M). S'appuie sur A, B, C, mais peut
   être fait avant : le formulaire réutilise `FormBody`, quels que soient les types de champs.

Tous les lots modifient `crud-resource.tsx`. Les exécuter séquentiellement, jamais en parallèle.

---

## Lot A — Type de champ `image` avec upload

### Fichiers

- `apps/backend/src/admin/components/crud-resource.tsx` : nouveau type `"image"` dans `FieldDef`,
  nouveau rendu dans `FieldInput`.
- `apps/backend/src/admin/components/image-field.tsx` (nouveau) : composant autonome
  `ImageField({ label, value, onChange })`. Extrait dans son propre fichier car la page homepage
  (`routes/content/homepage/page.tsx`) n'utilise pas `CrudResource` et doit l'importer directement.
- `apps/backend/src/admin/routes/content/blog/page.tsx` : `featured_image` passe en `type: "image"`,
  label « Image à la une ».
- `apps/backend/src/admin/routes/content/brands/page.tsx` : `logo` passe en `type: "image"`, label « Logo ».
- `apps/backend/src/admin/routes/content/stores/page.tsx` : `image` passe en `type: "image"`, label « Photo ».
- `apps/backend/src/admin/routes/content/homepage/page.tsx:277` : remplacer l'`Input` de `hero_image`
  par `ImageField`.

### Comportement de `ImageField`

- Valeur stockée : inchangée, l'URL complète en `string` (les modèles CMS et le storefront lisent
  une URL, aucune migration).
- Rendu quand `value` est vide : zone de dépôt en pointillés, texte « Glissez une image ou cliquez
  pour choisir », `<input type="file" accept="image/*">` masqué.
- Rendu quand `value` est renseignée : aperçu `<img>` (hauteur fixe ~160 px, `object-fit: contain`),
  bouton « Remplacer » (rouvre le sélecteur) et bouton « Retirer » (`onChange("")`).
- Upload : `sdk.admin.upload.create({ files: [file] })`, puis `onChange(files[0].url)`. État de
  chargement sur la zone pendant l'appel. `toast.error` sur échec, valeur précédente conservée.
- Garde-fou côté client : refuser les fichiers > 5 Mo et les types non `image/*` avec un `toast.error`
  explicite, avant l'appel réseau.
- Conserver une saisie manuelle d'URL derrière un lien discret « ou coller une adresse » qui révèle
  l'`Input` actuel. Raison : les images du seed et certaines marques pointent vers des URLs externes ;
  ne pas casser ce cas.

### Vérification

1. `pnpm --filter backend build` (ou la commande admin build du projet) passe sans erreur TypeScript.
2. En dev (`medusa develop`) : sur `/content/blog`, créer un article, déposer un `.jpg` : l'aperçu
   s'affiche, l'article sauvegardé a un `featured_image` qui commence par l'URL du provider local
   (`http://localhost:9000/static/...`).
3. Le storefront `/blog` affiche cette image sur la carte de l'article.
4. Modifier une marque existante dont le `logo` est une URL externe : l'aperçu s'affiche depuis
   l'URL externe, « Retirer » vide le champ, « Enregistrer » persiste `logo: ""`.
5. Homepage : `hero_image` accepte un upload et l'accueil du storefront l'affiche.

### STOP

- Si `sdk.admin.upload.create` répond 4xx en dev, vérifier que `medusa-config.ts` ne force pas le
  provider S3 sans `S3_ENDPOINT` ; ne pas contourner par un endpoint d'upload maison.

---

## Lot B — Éditeur riche pour le corps des articles

### Choix de la dépendance

**Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`,
`@tiptap/extension-image`). Justification :

- Sortie HTML (`editor.getHTML()`) et entrée HTML (`editor.commands.setContent(html)`) : le modèle
  `blog_post.content` reste du HTML, le storefront et `sanitizeHtml` ne changent pas.
- Headless : on stylise la toolbar avec `@medusajs/ui` (`Button`, `Tooltip`), pas de CSS tiers à
  intégrer dans le thème Medusa.
- Compatible React 18 (runtime backend `react@18.3.1`). Vérifier à l'installation que la version
  choisie de `@tiptap/react` déclare `react: ^18 || ^19` en peerDependency ; le repo force
  `@types/react@19` par override racine (cf. `PROJECT_REVIEW.md`, skew connu, masqué par `skipLibCheck`).

Alternatives écartées : Quill (CSS lourd, thème difficile à aligner), un simple Markdown
(changerait le format stocké, exigerait une conversion et le rendu côté Astro).

### Fichiers

- `apps/backend/package.json` : ajouter les 4 paquets Tiptap en `dependencies` (l'admin est buildé
  par `medusa build`, les deps de l'admin vivent dans le backend). Épingler les versions.
- `apps/backend/src/admin/components/rich-text-field.tsx` (nouveau) :
  `RichTextField({ label, value, onChange })`.
- `apps/backend/src/admin/components/crud-resource.tsx` : nouveau type `"richtext"` dans `FieldDef`,
  rendu via `RichTextField`. Supprimer le cas spécial `rows={field.key === "content" ? 12 : 4}`
  devenu inutile une fois `content` migré (c'est le seul usage).
- `apps/backend/src/admin/routes/content/blog/page.tsx` : `content` passe en `type: "richtext"`,
  label « Contenu ».

### Toolbar (volontairement minimale)

Titre 2, Titre 3, Paragraphe · Gras, Italique · Liste à puces, Liste numérotée · Lien (prompt URL,
ajoute `rel="noopener"` et `target="_blank"` si externe) · Image (réutilise l'upload du lot A :
sélecteur de fichier, upload, insertion `<img src alt>`) · Citation · Annuler / Rétablir.

Pas de tableau, pas de couleur, pas d'alignement, pas de HTML brut : tout ce que la toolbar peut
produire doit passer l'allowlist de `sanitize.ts` sans perte. Titre 1 exclu : le `<h1>` de la page
est le titre de l'article (`[slug].astro`).

### Contraintes techniques

- Le composant est contrôlé de l'extérieur (`value` string) mais Tiptap garde son propre état :
  synchroniser dans un seul sens. Sur `onUpdate`, appeler `onChange(editor.getHTML())`. Ne
  `setContent` depuis `value` que si `value !== editor.getHTML()` **et** que l'éditeur n'a pas le
  focus, sinon le curseur saute à chaque frappe.
- Un article vide doit donner `content: ""` et non `"<p></p>"` : normaliser dans `onChange`
  (`editor.isEmpty ? "" : html`).
- Styles de la zone d'édition : classe `prose prose-sm max-w-none` si Tailwind typography est
  disponible dans le build admin, sinon un bloc CSS minimal (marges des `h2/h3/p/ul/ol/blockquote`)
  scopé au composant. Vérifier au premier rendu, ne pas supposer.
- Hauteur minimale ~320 px, bordure `border-ui-border-base`, fond `bg-ui-bg-field`, cohérent avec
  les `Textarea` de Medusa.

### Vérification

1. Build admin OK.
2. Ouvrir en édition un article du seed dont le `content` contient `h2`, `p`, `ul`, `a`, `img` :
   tout s'affiche dans l'éditeur, « Enregistrer » sans modification ne change pas le HTML de façon
   visible sur le storefront (comparer la page `/blog/<slug>` avant / après ; des différences
   d'attributs ou d'espaces sont acceptables, une perte de contenu ne l'est pas).
3. Créer un article via la toolbar uniquement (titre, gras, liste, lien externe, image uploadée),
   publier, ouvrir `/blog/<slug>` : tout est rendu, le lien externe a `target="_blank"`, l'image
   est visible. Aucune balise n'est supprimée par `sanitizeHtml` (inspecter le DOM).
4. Taper 200 caractères d'affilée : le curseur ne saute pas, pas de lag notable.
5. Vider entièrement l'éditeur, enregistrer : `content` vaut `""` en base (ou `null`), pas `"<p></p>"`.

### STOP

- Si l'installation de Tiptap fait échouer `medusa build` à cause du skew `@types/react` 18/19,
  ne pas toucher l'override racine (impact storefront). Documenter l'erreur exacte dans la ligne
  de statut et passer aux lots restants.

---

## Lot C — Champs typés : date, catégorie, slug

### Fichiers

- `apps/backend/src/admin/components/crud-resource.tsx` : types `"date"` et `"select"` dans
  `FieldDef` ; `options?: { value: string; label: string }[]` pour `select` ; `slugFrom?: string`
  pour l'auto-génération.
- `apps/backend/src/admin/routes/content/blog/page.tsx` : `publish_date` → `type: "date"` ;
  `category` → `type: "select"` avec les 3 options ; `slug` → `slugFrom: "title"`.
- `apps/backend/src/api/admin/cms/blog-posts/validators.ts` : durcir `slug` et `category` (voir plus bas).

### Date

- `DatePicker` de `@medusajs/ui`. Valeur stockée inchangée : chaîne ISO `YYYY-MM-DD` (le modèle
  est `model.text()`, le tri backend et `formatDate` du storefront s'appuient sur ce format).
- Conversion : `Date` locale → `YYYY-MM-DD` sans passer par `toISOString()` (décalage UTC la veille
  après 22 h en France). Utiliser `getFullYear/getMonth/getDate`.
- Valeur par défaut à la création : la date du jour (aujourd'hui `emptyItem.publish_date` est `""`).

### Catégorie

- `Select` de `@medusajs/ui` avec les 3 clés connues du storefront et leurs libellés :
  `sleep-tips` « Conseils sommeil », `product-guides` « Guides produits », `company-news` « Actualités ».
- La source de vérité des libellés reste `blog/index.astro:23`. Dupliquer la liste dans la page
  admin est acceptable (3 entrées, deux apps sans code partagé) ; ajouter un commentaire croisé
  dans les deux fichiers.
- Backend : `category: z.enum(["sleep-tips", "product-guides", "company-news"]).nullish()`.
  Vérifier d'abord en base qu'aucun article existant n'a une autre valeur (`SELECT DISTINCT category
  FROM blog_post`). Si oui, corriger la donnée avant de durcir le schéma.

### Slug

- Auto-généré depuis `title` tant que l'utilisateur n'a pas modifié le slug à la main
  (flag local `slugTouched`). Fonction `slugify` : NFD + suppression des diacritiques, minuscules,
  `[^a-z0-9]+` → `-`, trim des `-`. Pas de dépendance.
- Champ toujours visible et éditable, avec un texte d'aide « Adresse de la page : /blog/<slug> ».
- Backend : `slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)` et contrôle d'unicité dans
  `createBlogPostWorkflow` / `updateBlogPostWorkflow` (`listBlogPosts({ slug })`, erreur
  `MedusaError.Types.DUPLICATE_ERROR` si un autre id existe). Message d'erreur en français,
  remonté tel quel par le `toast.error` du CRUD.

### Vérification

1. Créer un article intitulé « Comment choisir son matelas à mémoire de forme ? » : le slug proposé
   est `comment-choisir-son-matelas-a-memoire-de-forme`.
2. Modifier le slug à la main puis retaper le titre : le slug ne bouge plus.
3. Choisir une date au `DatePicker` : la valeur envoyée (onglet réseau) est `YYYY-MM-DD` du jour
   choisi, pas de la veille.
4. Envoyer via `curl` un `POST /admin/cms/blog-posts` avec `slug: "Mon Slug"` : 400.
5. Créer deux articles avec le même slug : le second échoue avec un message lisible dans le toast.
6. Le filtre par catégorie de `/blog` fonctionne pour un article créé via le `Select`.

---

## Lot D — Page article dédiée et lien « Voir sur le site »

### Motivation

Le `Drawer` d'édition est adapté aux entités courtes (marque, témoignage, magasin). Un article a un
corps long : il lui faut une page plein écran. Pattern connu des éditeurs (WordPress, Notion) :
contenu principal à gauche, métadonnées à droite.

### Fichiers

- `apps/backend/src/admin/routes/content/blog/[id]/page.tsx` (nouveau) : page d'édition. Le
  routing par fichier de l'admin Medusa supporte les segments dynamiques `[id]` (`useParams` de
  `react-router-dom`, déjà en dépendance).
- `apps/backend/src/admin/routes/content/blog/page.tsx` : la liste conserve `CrudResource` pour
  la table et la suppression, mais « Modifier » navigue vers `/content/blog/:id` et « Créer » crée
  d'abord un brouillon minimal puis navigue vers sa page (voir « Création »).
- `apps/backend/src/admin/components/crud-resource.tsx` : prop optionnelle `editHref?: (item) => string`.
  Si fournie, le bouton « Modifier » devient un `Link` et le `Drawer` n'est pas monté. Prop
  optionnelle `onCreate?: () => void` pour remplacer l'ouverture du `FocusModal`.

### Page `/content/blog/:id`

- Chargement : `useQuery(["cms-blog-post", id], () => sdk.client.fetch("/admin/cms/blog-posts/" + id))`.
- Layout : `Container` deux colonnes (`grid lg:grid-cols-[1fr_320px]`) ; sur écran étroit, une colonne.
  - Gauche : `title` (Input large), `excerpt` (Textarea), `content` (`RichTextField`).
  - Droite, dans des blocs séparés : « Publication » (`published` Switch, `publish_date` DatePicker),
    « Classement » (`category` Select, `author`), « Adresse » (`slug` avec auto-génération),
    « Image à la une » (`ImageField`).
- Barre d'actions en haut : « Retour à la liste », « Voir sur le site » (voir plus bas),
  « Enregistrer » (`isLoading` sur la mutation). Sauvegarde explicite uniquement, pas d'auto-save.
- Garde-fou de sortie : si le formulaire a des modifications non enregistrées, le bouton « Retour »
  demande confirmation via `Prompt` de `@medusajs/ui`. Ne pas intercepter la navigation navigateur
  (pas de `beforeunload`), hors de proportion pour ce cas.
- Réutiliser `FormBody`/`FieldInput` de `crud-resource.tsx` pour chaque champ : exporter `FieldInput`
  et passer les mêmes `FieldDef`, afin que les types `image`, `richtext`, `date`, `select`, `slugFrom`
  soient rendus au même endroit qu'ailleurs. La page ne fait que disposer les champs en deux colonnes.

### Création

Créer immédiatement un brouillon `{ title: "Nouvel article", slug: "nouvel-article-<horodatage>",
published: false, publish_date: <aujourd'hui> }` via `POST`, puis naviguer vers sa page. Justification :
un seul formulaire d'édition à maintenir, et la page d'article a besoin d'un `id` (upload d'image,
lien « Voir sur le site »). Un brouillon abandonné reste `published: false` et n'apparaît jamais sur
le storefront (`GET /store/cms/blog-posts` filtre `published: true`) ; l'utilisateur le supprime
depuis la liste.

### « Voir sur le site »

- URL cible : `${STOREFRONT_URL}/blog/${slug}`. L'admin ne connaît pas l'URL du storefront
  aujourd'hui. Exposer `STOREFRONT_URL` au bundle admin via `medusa-config.ts` → `admin.vite`
  `define` (`import.meta.env.VITE_STOREFRONT_URL`), avec repli `http://localhost:4321` en dev.
  `STORE_CORS` existe déjà mais c'est une liste séparée par des virgules
  (`apps/backend/.env.template:1`), inutilisable comme URL unique : ajouter `STOREFRONT_URL` au
  `.env.template` et à `DEPLOY.md`.
- Désactivé (`Tooltip` « Publiez l'article pour le voir sur le site ») tant que `published` est
  `false` ou que le formulaire a des modifications non enregistrées.
- Ouvre dans un nouvel onglet.

### Vérification

1. Depuis `/content/blog`, « Créer » mène sur `/content/blog/<id>` avec un brouillon non publié ;
   revenir à la liste sans rien faire : le brouillon est listé « Publié : Non » et supprimable.
2. Éditer un article existant : les 9 champs sont préremplis, « Enregistrer » persiste, le toast
   confirme, la liste reflète le changement.
3. « Voir sur le site » est grisé sur un brouillon, actif après publication + enregistrement, et
   ouvre la bonne page storefront.
4. Modifier le titre puis « Retour » : la confirmation s'affiche ; « Annuler » reste sur la page.
5. Les autres écrans « Contenu » (marques, magasins, témoignages, contact) sont inchangés :
   `Drawer` d'édition toujours fonctionnel, aucune régression de `CrudResource`.
6. Largeur 1024 px : les deux colonnes tiennent sans défilement horizontal ; 768 px : une colonne.

---

## Après ce plan (non inclus, à décider séparément)

- **Widget fiche produit** : zone `product.details.after`, éditeur riche écrivant dans
  `product.description` (ou `metadata.description_html` si le storefront rend `description` en texte
  brut, à vérifier dans `catalog-client.ts`). Réutilise `RichTextField` du lot B tel quel.
- **Brouillon visible** : mode « prévisualisation » côté Astro par jeton signé pour voir un article
  non publié. Utile seulement si l'éditeur rédige longtemps avant de publier.
- **Bibliothèque d'images** : Medusa n'a pas de médiathèque native ; si les uploads se multiplient,
  une page listant les fichiers du provider avec réutilisation.
- **Réordonnancement par glisser-déposer** des marques et témoignages (`rank`) : aujourd'hui un
  champ numérique.

## Ligne de statut (à tenir par l'exécuteur)

| Lot | Statut | Commit | Notes |
|---|---|---|---|
| A — image upload | Implémenté, à vérifier en dev | | `ImageField` dans `components/image-field.tsx`, type `"image"` dans `CrudResource`, câblé sur blog / marques / magasins / accueil. Typecheck OK. Vérifications 2 à 5 du lot non faites : elles demandent un serveur de dev et un navigateur. |
| B — éditeur riche | TODO | | |
| C — date / catégorie / slug | Implémenté, migration de données en attente | | `DatePicker`, `Select` et slug auto (`slugFrom` + `slugify`) dans `CrudResource` ; `slug` (regex) et `category` (enum) durcis dans les validateurs ; unicité du slug dans `createBlogPostStep` / `updateBlogPostStep`. Les données de seed passent de `conseils` à `sleep-tips` (décision : les 3 clés du storefront font foi). **Reste à faire : migrer les articles déjà en base** (`UPDATE blog_post SET category = 'sleep-tips' WHERE category = 'conseils';`) — Postgres était arrêté au moment de l'exécution, le `SELECT DISTINCT category` n'a pas pu être lancé. Tant que cette migration n'est pas passée, un article en `conseils` sera rejeté par l'enum à l'enregistrement. |
| D — page article | TODO | | |

### Écart constaté hors périmètre du plan

Sur le storefront, `categoryNames[post.category]` est utilisé sans repli sur les badges de catégorie
(`blog/index.astro:141`, `blog/[slug].astro:100` et `:189`), alors que le filtre, lui, a un repli
(`index.astro:97`). Une catégorie inconnue affiche donc un badge vide. Non corrigé : hors périmètre.
