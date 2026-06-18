# Bleunuit Website - Astro + Directus

Site web pour Literie Bleunuit construit avec Astro et Directus CMS.

## 🚀 Technologies

- **[Astro](https://astro.build/)** - Framework web moderne pour des sites ultra-rapides
- **[Directus](https://directus.io/)** - CMS headless open-source
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript avec typage statique
- **[React](https://react.dev/)** - Pour les composants React

## 📋 Prérequis

- Node.js 18+ et npm

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec votre URL Directus
```

## 🧞 Commandes

| Commande | Action |
|----------|--------|
| `npm run dev` | Lance le serveur de développement sur `localhost:4321` |
| `npm run build` | Construit le site de production dans `./dist/` |
| `npm run preview` | Prévisualise le build en local avant déploiement |

## 📝 Configuration de Directus

### Installation de Directus

#### Option 1: Directus Cloud (Recommandé)
1. Créez un compte sur [Directus Cloud](https://directus.cloud/)
2. Créez un nouveau projet
3. Copiez l'URL de votre instance dans le fichier `.env`

#### Option 2: Installation locale
```bash
# Installer Directus localement avec Docker
docker run -d \
  --name directus \
  -p 8055:8055 \
  -e KEY=your-random-key \
  -e SECRET=your-random-secret \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=password \
  -e DB_CLIENT=sqlite3 \
  -e DB_FILENAME=/directus/database/database.sqlite \
  directus/directus

# OU avec npm
npx create-directus-project my-directus
```

### Configuration des Collections Directus

Accédez à votre instance Directus (http://localhost:8055 ou votre URL cloud) et créez les collections suivantes :

#### 🗂️ Collection: `categories`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `name` | String | Unique |
| `name_fr` | String | Label français |
| `description` | Text | Optionnel |
| `icon` | String | Emoji ou classe d'icône |
| `order` | Integer | Ordre d'affichage |
| `show_in_menu` | Boolean | Afficher dans le menu |

#### 🗂️ Collection: `subcategories`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `name` | String | Unique |
| `name_fr` | String | Label français |
| `category` | Many-to-One | Relation vers `categories` |
| `description` | Text | Optionnel |
| `order` | Integer | Ordre d'affichage |

#### 🗂️ Collection: `products`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `title` | String | Titre du produit |
| `slug` | String | Unique, URL-friendly |
| `brand` | String | Marque |
| `category` | Many-to-One | Relation vers `categories` |
| `subcategory` | Many-to-One | Relation vers `subcategories` |
| `price` | Decimal | Prix en euros |
| `promo_price` | Decimal | Prix promotionnel (optionnel) |
| `featured_image` | File | Image principale |
| `gallery` | Files | Images supplémentaires |
| `description` | WYSIWYG | Description HTML |
| `featured` | Boolean | Produit en vedette |
| `in_stock` | Boolean | En stock |

#### 🗂️ Collection: `stores`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `name` | String | Nom du magasin |
| `slug` | String | Unique |
| `address` | String | Adresse |
| `city` | String | Ville |
| `postal_code` | String | Code postal |
| `phone` | String | Téléphone |
| `email` | String | Email |
| `hours` | JSON | Horaires d'ouverture |
| `map_url` | String | URL Google Maps |
| `latitude` | Float | Latitude GPS |
| `longitude` | Float | Longitude GPS |
| `additional_info` | WYSIWYG | Informations complémentaires |

#### 🗂️ Collection: `blog_posts`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `title` | String | Titre de l'article |
| `slug` | String | Unique |
| `publish_date` | Date | Date de publication |
| `author` | String | Auteur |
| `excerpt` | Text | Extrait |
| `featured_image` | File | Image à la une |
| `category` | String | Catégorie (dropdown) |
| `content` | WYSIWYG | Contenu HTML |
| `published` | Boolean | Publié |

#### 🗂️ Collection: `brands`
| Champ | Type | Options |
|-------|------|---------|
| `id` | UUID | Primary Key |
| `name` | String | Nom de la marque |
| `slug` | String | Unique |
| `logo` | File | Logo |
| `website` | String | URL du site web |
| `description` | Text | Description |
| `order` | Integer | Ordre d'affichage |

#### 🗂️ Collection: `site_settings` (Singleton)
| Champ | Type | Options |
|-------|------|---------|
| `id` | Integer | Primary Key |
| `site_name` | String | Nom du site |
| `tagline` | String | Slogan |
| `description` | Text | Description du site |
| `google_reviews_url` | String | URL Google Reviews |
| `reviews_count` | Integer | Nombre d'avis |
| `average_rating` | Float | Note moyenne |
| `finance_info` | WYSIWYG | Informations financement |

### Configuration des permissions

1. Dans Directus, allez dans **Settings** → **Roles & Permissions**
2. Créez un rôle "Public" avec les permissions suivantes :
   - **Read** pour toutes les collections ci-dessus
   - **No access** pour les opérations Create, Update, Delete

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
PUBLIC_DIRECTUS_URL=http://localhost:8055
```

Pour la production :
```env
PUBLIC_DIRECTUS_URL=https://your-directus-instance.cloud.directus.app
```

## 🎨 Structure du projet

```
/
├── public/               # Assets statiques (images, favicon, etc.)
├── src/
│   ├── components/      # Composants Astro réutilisables
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── ProductCard.astro
│   ├── layouts/         # Layouts de pages
│   │   └── Layout.astro
│   ├── pages/           # Pages du site (routing automatique)
│   │   ├── index.astro                          # Page d'accueil
│   │   ├── contact.astro                        # Page contact
│   │   ├── produits/
│   │   │   ├── index.astro                      # Liste des produits
│   │   │   ├── [category].astro                 # Produits par catégorie
│   │   │   └── [category]/
│   │   │       ├── [subcategory].astro          # Produits par sous-catégorie
│   │   │       └── p/[slug].astro               # Détail produit
│   │   ├── magasins/
│   │   │   └── index.astro                      # Page magasins
│   │   └── blog/
│   │       ├── index.astro                      # Liste des articles
│   │       └── [slug].astro                     # Détail article
│   ├── utils/          # Fonctions utilitaires
│   │   └── directus-client.ts                   # Client Directus
│   └── styles/          # Styles globaux
│       └── global.css
├── directus.config.ts  # Configuration Directus (schémas TypeScript)
├── astro.config.mjs     # Configuration Astro
├── .env                 # Variables d'environnement (à ne pas commiter)
├── .env.example         # Exemple de configuration
└── package.json
```

## 🚢 Déploiement

### Option 1 : Netlify (Recommandé)

1. Connectez votre repository GitHub à Netlify
2. Configuration de build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
3. Déployez !

### Option 2 : Vercel

1. Connectez votre repository à Vercel
2. Vercel détectera automatiquement Astro
3. Déployez !

### Option 3 : Mode local (Git-based)

Keystatic fonctionne avec votre système de fichiers local. Pour persister les changements :

```bash
git add .
git commit -m "Update content"
git push
```

## 📚 Pages disponibles

- **`/`** - Page d'accueil avec produits en vedette
- **`/produits`** - Catalogue complet des produits
- **`/produits/[category]`** - Produits par catégorie
- **`/produits/[category]/[subcategory]`** - Produits par sous-catégorie
- **`/produits/[category]/p/[slug]`** - Détail d'un produit
- **`/magasins`** - Nos points de vente
- **`/blog`** - Articles et conseils
- **`/blog/[slug]`** - Article détaillé
- **`/contact`** - Formulaire de contact

## 🎯 Prochaines étapes

### Fonctionnalités à ajouter :

1. **Intégration Google Reviews API** pour afficher les avis en temps réel
2. **Formulaire de contact fonctionnel** avec backend (Netlify Forms ou API)
3. **Recherche de produits** avec Algolia ou Pagefind
4. **Système de panier** (optionnel, si vente en ligne)
5. **Optimisation SEO avancée** avec sitemap XML et structured data
6. **Authentification Directus** pour un backoffice sécurisé
7. **Images optimisées** avec l'intégration Directus Assets

### Migration du contenu existant :

1. Configurez votre instance Directus et créez toutes les collections
2. Exportez le contenu de votre CMS actuel
3. Importez les données dans Directus (via l'API ou l'interface)
4. Uploadez les images dans Directus Assets
5. Vérifiez que tout s'affiche correctement sur le site

## 📖 Documentation

- [Astro Documentation](https://docs.astro.build)
- [Directus Documentation](https://docs.directus.io)
- [Directus SDK Documentation](https://docs.directus.io/packages/@directus/sdk/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Support

Pour toute question ou problème, contactez votre développeur ou consultez la documentation des technologies utilisées.

---

**Développé avec ❤️ pour Literie Bleunuit**
