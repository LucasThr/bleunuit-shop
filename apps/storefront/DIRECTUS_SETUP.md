# Directus Collections Setup Guide

This guide will help you create all the necessary collections in your Directus instance.

## Schema Migrations (recommended)

Incremental schema/data changes live in `migrations/` and are applied with:

```bash
npm run migrate                  # applies pending migrations to DIRECTUS_URL (.env)
npm run migrate -- --env=staging # targets DIRECTUS_URL_STAGING / _ADMIN_EMAIL_STAGING / _ADMIN_PASSWORD_STAGING
npm run migrate -- --env=prod    # same with the _PROD suffix
npm run migrate -- --dry-run     # list pending migrations without applying
```

Each environment tracks its own applied migrations in a hidden `migrations_log`
collection, so the command is safe to re-run. To add a new migration, create
`migrations/NNN-short-name.mjs` exporting an async `up({ api })` function (see
existing files for the pattern) — never edit an already-applied migration.

The sections below describe the full schema for reference / first-time manual setup.

## Collections to Create

### 1. Categories Collection

**Collection Name:** `categories`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `name` (String) - Required
- `name_fr` (String) - French name
- `slug` (String) - Required, unique. URL identifier (lowercase, no accents, hyphens — e.g. `tetes-de-lit`)
- `description` (Text)
- `icon` (String) - Icon identifier
- `order` (Integer) - For sorting, default: 0
- `show_in_menu` (Boolean) - Default: true

### 2. Subcategories Collection

**Collection Name:** `subcategories`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `name` (String) - Required
- `name_fr` (String) - French name
- `slug` (String) - Required, unique. URL identifier (lowercase, no accents, hyphens)
- `category` (Many-to-One Relation) - Related to `categories`
- `description` (Text)
- `order` (Integer) - For sorting, default: 0

### 3. Products Collection

**Collection Name:** `products`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `name` (String) - Required
- `slug` (String) - Required, unique
- `brand` (Many-to-One Relation) - Related to `brands`
- `category` (Many-to-One Relation) - Related to `categories`
- `subcategory` (Many-to-One Relation) - Related to `subcategories`
- `price` (Decimal/Float) - Required
- `promo_price` (Decimal/Float)
- `featured_image` (Image/File)
- `gallery` (Files/Multiple Images)
- `description` (WYSIWYG/Text)
- `featured` (Boolean) - Default: false
- `in_stock` (Boolean) - Default: true

### 4. Stores Collection

**Collection Name:** `stores`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `name` (String) - Required
- `slug` (String) - Required, unique
- `address` (String) - Required
- `city` (String) - Required
- `postal_code` (String) - Required
- `phone` (String) - Required
- `email` (String/Email) - Required
- `hours` (JSON) - Store opening hours
- `map_url` (String)
- `latitude` (Float)
- `longitude` (Float)
- `additional_info` (Text)

### 5. Blog Posts Collection

**Collection Name:** `blog_posts`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `title` (String) - Required
- `slug` (String) - Required, unique
- `publish_date` (Date/DateTime) - Required
- `author` (String) - Required
- `excerpt` (Text)
- `featured_image` (Image/File)
- `category` (String)
- `content` (WYSIWYG)
- `published` (Boolean) - Default: false

### 6. Brands Collection

**Collection Name:** `brands`

Fields to add:

- `id` (UUID, Primary Key) - Auto-generated
- `name` (String) - Required
- `slug` (String) - Required, unique
- `logo` (Image/File)
- `website` (String)
- `description` (Text)
- `order` (Integer) - For sorting, default: 0

### 7. Site Settings (Singleton)

**Collection Name:** `site_settings`
**Type:** Singleton

Fields to add:

- `id` (Integer, Primary Key) - Auto-generated
- `site_name` (String) - Required
- `tagline` (String) - Required
- `description` (Text)
- `google_reviews_url` (String)
- `reviews_count` (Integer)
- `average_rating` (Float/Decimal)
- `finance_info` (Text/WYSIWYG)

## Quick Setup Steps

1. **Access your Directus Admin Panel**

   - Go to your Directus URL in the browser
   - Log in with your admin credentials
2. **Create each collection:**

   - Go to Settings > Data Model
   - Click "Create Collection"
   - For regular collections: Choose "Collection"
   - For site_settings: Choose "Singleton"
   - Follow the field definitions above
3. **Set up Relations:**

   - When creating relation fields (like `category` in products):
     - Type: Many-to-One (M2O)
     - Related Collection: Select the target collection
     - Display Template: Choose what to show (usually `name` or `title`)
4. **Configure Permissions:**

   - Go to Settings > Roles & Permissions
   - For Public role: Grant read access to collections you want to be publicly accessible
   - Ensure your API has proper access
5. **Add Sample Data:**

   - Start adding categories, products, etc. through the Directus interface

## Field Type Reference

- **String**: Text input for short text
- **Text**: Textarea for longer text
- **WYSIWYG**: Rich text editor
- **Integer**: Whole numbers
- **Float/Decimal**: Decimal numbers
- **Boolean**: True/false checkbox
- **Date/DateTime**: Date and time picker
- **JSON**: For structured data like store hours
- **Image/File**: File upload
- **UUID**: Universally unique identifier (auto-generated)

## Notes

- Make sure to set required fields as indicated
- Use consistent naming (snake_case for field names)
- Set default values where mentioned
- For the `slug` fields, you may want to set them as required and unique
