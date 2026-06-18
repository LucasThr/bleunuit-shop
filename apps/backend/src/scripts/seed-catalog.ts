import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { CMS_MODULE } from "../modules/cms"
import CmsModuleService from "../modules/cms/service"
import { createBrandWorkflow } from "../workflows/brand"
import {
  categories,
  subcategories,
  brands,
  products,
} from "./data/catalog-content"

/**
 * Migrates the marketing catalog (categories, subcategories, brands, products)
 * from the old Directus instance into native Medusa entities, so the
 * storefront catalog reads from Medusa. Brands go into the cms module.
 *
 * Idempotent: categories are upserted by handle (reusing any created by
 * seed-bleunuit), products are skipped if the handle already exists, brands
 * are skipped if any already exist.
 *
 * Per-product attributes that Medusa has no native field for (brand name,
 * promo price, featured flag, stock flag, subcategory) are stored in product
 * metadata; the storefront reads them via src/utils/catalog-client.ts.
 *
 * Run with:  npx medusa exec ./src/scripts/seed-catalog.ts
 */
export default async function seedCatalog({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms: CmsModuleService = container.resolve(CMS_MODULE)

  // --- Resolve the sales channel + shipping profile -------------------------
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const salesChannel =
    channels.find((c) => c.name === "Default Sales Channel") ?? channels[0]

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfiles[0]

  // --- Categories (upsert by handle) ---------------------------------------
  const { data: existingCats } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const handleToId = new Map<string, string>(
    existingCats.map((c) => [c.handle, c.id])
  )

  const ensureCategory = async (
    desired: {
      name: string
      handle: string
      description: string
      rank: number
      icon?: string
    },
    parentId: string | null
  ) => {
    const data = {
      name: desired.name,
      description: desired.description,
      is_active: true,
      rank: desired.rank,
      parent_category_id: parentId,
      metadata: {
        icon: desired.icon ?? null,
        show_in_menu: !parentId,
      },
    }
    const existingId = handleToId.get(desired.handle)
    if (existingId) {
      await updateProductCategoriesWorkflow(container).run({
        input: { selector: { id: existingId }, update: data },
      })
      return existingId
    }
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ handle: desired.handle, ...data }] },
    })
    const id = result[0].id
    handleToId.set(desired.handle, id)
    return id
  }

  for (const cat of categories) {
    await ensureCategory(cat, null)
  }
  for (const sub of subcategories) {
    const parentId = handleToId.get(sub.parent_handle) ?? null
    await ensureCategory(sub, parentId)
  }
  logger.info(
    `[seed-catalog] Upserted ${categories.length} categories + ${subcategories.length} subcategories.`
  )

  // --- Products (skip existing by handle) -----------------------------------
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set(existingProducts.map((p) => p.handle))

  let createdCount = 0
  for (const p of products) {
    if (existingHandles.has(p.handle)) {
      continue
    }
    const categoryIds = [handleToId.get(p.category_handle)].filter(
      Boolean
    ) as string[]
    if (p.subcategory_handle) {
      const subId = handleToId.get(p.subcategory_handle)
      if (subId) {
        categoryIds.push(subId)
      }
    }

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            category_ids: categoryIds,
            shipping_profile_id: shippingProfile?.id,
            metadata: {
              brand: p.brand,
              promo_price: p.promo_price,
              featured: p.featured,
              in_stock: p.in_stock,
              category_handle: p.category_handle,
              subcategory_handle: p.subcategory_handle,
            },
            options: [{ title: "Format", values: ["Standard"] }],
            variants: [
              {
                title: "Standard",
                options: { Format: "Standard" },
                manage_inventory: false,
                prices: [{ amount: p.price, currency_code: "eur" }],
              },
            ],
            sales_channels: [{ id: salesChannel.id }],
          },
        ],
      },
    })
    createdCount++
  }
  logger.info(
    `[seed-catalog] Created ${createdCount} catalog products (skipped ${
      products.length - createdCount
    } existing).`
  )

  // --- Brands (cms collection, skip if any exist) ---------------------------
  const existingBrands = await cms.listBrands({}, { take: 1 })
  if (existingBrands.length) {
    logger.info("[seed-catalog] Brands already exist — skipping.")
  } else {
    for (const brand of brands) {
      await createBrandWorkflow(container).run({ input: brand })
    }
    logger.info(`[seed-catalog] Seeded ${brands.length} brands.`)
  }

  logger.info("[seed-catalog] Catalog seed complete.")
}
