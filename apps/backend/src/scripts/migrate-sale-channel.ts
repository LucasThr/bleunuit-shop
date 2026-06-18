import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Migrates products from the legacy boolean `metadata.purchasable` to the
 * `metadata.sale_channel` enum ("online" | "in_store" | "both").
 *
 *   purchasable === true  -> "both"   (online products are also sold in-store)
 *   otherwise             -> "in_store"
 *
 * The old `purchasable` key is removed. Idempotent: products that already have
 * a `sale_channel` are skipped.
 *
 * Run with:  npx medusa exec ./src/scripts/migrate-sale-channel.ts
 */
export default async function migrateSaleChannel({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
  })

  let updated = 0
  for (const p of products) {
    const md = { ...((p.metadata ?? {}) as Record<string, unknown>) }
    if (md.sale_channel) {
      continue
    }
    md.sale_channel = md.purchasable === true ? "both" : "in_store"
    delete md.purchasable
    await productModule.updateProducts(p.id, { metadata: md })
    updated++
  }

  logger.info(
    `[migrate-sale-channel] Updated ${updated} products (skipped ${
      products.length - updated
    } already migrated).`
  )
}
