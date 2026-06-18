import type { Product } from './catalog-client';
import { slugFor } from './slugs';

// Catalog images are full URLs (or null). Kept as a function with the old
// (width/height/quality) signature so the product detail page call site is
// unchanged; it just returns the URL as-is.
export function productImageUrl(
  url: string | null | undefined,
  _width?: number,
  _height?: number,
  _quality?: number
): string | null {
  return url || null;
}

// Maps a Medusa-backed catalog product to the props expected by <ProductCard />.
export function mapProductToCard(product: Product) {
  const category = typeof product.category === 'object' ? product.category : null;

  return {
    title: product.name || 'No title',
    brand:
      typeof product.brand === 'object'
        ? (product.brand as any)?.name || ''
        : product.brand || '',
    price: parseFloat(product.price) || 0,
    promoPrice: product.promo_price ? parseFloat(product.promo_price) : undefined,
    image:
      product.featured_image ||
      `https://placehold.co/800x600/e5e7eb/6b7280?text=${encodeURIComponent(product.name || 'Product')}`,
    slug: product.slug || '',
    categorySlug: category ? slugFor(category) : String(product.category ?? ''),
    categoryName: category ? category.name : String(product.category ?? ''),
    purchasable: product.purchasable,
  };
}
