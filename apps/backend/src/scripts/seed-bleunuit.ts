import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createShippingOptionsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * POC seed for Bleunuit (mattress store).
 *
 * Reuses the entities created by the default seed (Europe/EUR region,
 * Default Sales Channel, European Warehouse stock location, Default
 * Shipping Profile, the "Europe" service zone) and layers on:
 *   - a small mattress catalog (rolled + traditional + an accessory)
 *   - Bleunuit-specific shipping options that encode the agreed model:
 *       parcel (Chronopost), bulky (quote on request), in-store pickup.
 *
 * The `shipping_class` on each product's metadata is what the storefront
 * checkout uses to decide which shipping options to offer.
 *
 * Run with:  npx medusa exec ./src/scripts/seed-bleunuit.ts
 */
export default async function seedBleunuit({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // --- Resolve existing entities created by the default seed ---------------
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const salesChannel =
    channels.find((c) => c.name === "Default Sales Channel") ?? channels[0];

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  });
  const region = regions.find((r) => r.name === "Europe") ?? regions[0];

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  const stockLocation = stockLocations[0];

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  });
  const shippingProfile = shippingProfiles[0];

  const { data: serviceZones } = await query.graph({
    entity: "service_zone",
    fields: ["id", "name"],
  });
  const serviceZone =
    serviceZones.find((z) => z.name === "Europe") ?? serviceZones[0];

  logger.info(
    `Reusing channel=${salesChannel?.id} region=${region?.id} ` +
      `stockLocation=${stockLocation?.id} profile=${shippingProfile?.id} ` +
      `serviceZone=${serviceZone?.id}`
  );

  // --- Remove the demo clothing products so the catalog is mattress-only ---
  const { data: demoProducts } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
  });
  const demoIds = demoProducts
    .filter((p) => p.title?.startsWith("Medusa "))
    .map((p) => p.id);
  if (demoIds.length) {
    await deleteProductsWorkflow(container).run({ input: { ids: demoIds } });
    logger.info(`Removed ${demoIds.length} demo products.`);
  }

  // --- Categories ----------------------------------------------------------
  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Matelas", is_active: true },
        { name: "Sommiers", is_active: true },
        { name: "Accessoires", is_active: true },
      ],
    },
  });
  const catId = (name: string) => categories.find((c) => c.name === name)!.id;

  // --- Products (prices are EUR, TTC) --------------------------------------
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Matelas Dunlopillo Roulé 140×190",
          handle: "matelas-dunlopillo-roule-140x190",
          description:
            "Matelas mousse haute résilience livré roulé-compressé. " +
            "Expédié partout en France par Chronopost.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Matelas")],
          shipping_profile_id: shippingProfile.id,
          weight: 18000,
          // shipping_class drives the storefront's shipping-option logic
          metadata: { shipping_class: "parcel" },
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
          ],
          options: [{ title: "Dimensions", values: ["140×190"] }],
          variants: [
            {
              title: "140×190",
              sku: "MAT-ROULE-140190",
              options: { Dimensions: "140×190" },
              prices: [{ amount: 599, currency_code: "eur" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
        {
          title: "Matelas André Renault Tradition 160×200",
          handle: "matelas-andre-renault-tradition-160x200",
          description:
            "Matelas ressorts ensachés grand confort, non compressible. " +
            "Livraison locale par nos soins ou sur devis transporteur.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Matelas")],
          shipping_profile_id: shippingProfile.id,
          weight: 38000,
          metadata: { shipping_class: "bulky" },
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
          ],
          options: [{ title: "Dimensions", values: ["160×200"] }],
          variants: [
            {
              title: "160×200",
              sku: "MAT-TRAD-160200",
              options: { Dimensions: "160×200" },
              prices: [{ amount: 1290, currency_code: "eur" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
        {
          title: "Oreiller à mémoire de forme",
          handle: "oreiller-memoire-de-forme",
          description:
            "Oreiller ergonomique à mémoire de forme. Expédié par Chronopost.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Accessoires")],
          shipping_profile_id: shippingProfile.id,
          weight: 1200,
          metadata: { shipping_class: "parcel" },
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
          ],
          options: [{ title: "Format", values: ["60×40"] }],
          variants: [
            {
              title: "60×40",
              sku: "OREILLER-MEM-6040",
              options: { Format: "60×40" },
              prices: [{ amount: 59, currency_code: "eur" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
      ],
    },
  });
  logger.info("Created mattress catalog.");

  // --- Inventory levels for the new variants -------------------------------
  const ourSkus = ["MAT-ROULE-140190", "MAT-TRAD-160200", "OREILLER-MEM-6040"];
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });
  const newItems = inventoryItems.filter((i) => i.sku && ourSkus.includes(i.sku));
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: newItems.map((item) => ({
        location_id: stockLocation.id,
        inventory_item_id: item.id,
        stocked_quantity: 25,
      })),
    },
  });
  logger.info(`Stocked ${newItems.length} inventory items.`);

  // --- Bleunuit shipping options on the existing Europe service zone -------
  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ];
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Livraison Chronopost (colis roulé)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        data: { shipping_class: "parcel" },
        type: {
          label: "Chronopost",
          description: "Colis roulé, livraison 48-72h.",
          code: "chronopost-parcel",
        },
        prices: [{ currency_code: "eur", amount: 9.9 }],
        rules: storeRules,
      },
      {
        name: "Livraison à domicile — sur devis (volumineux)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        data: { shipping_class: "bulky", quote_on_request: true },
        type: {
          label: "Sur devis",
          description:
            "Produit volumineux : nous vous recontactons avec un devis de livraison.",
          code: "bulky-quote",
        },
        prices: [{ currency_code: "eur", amount: 0 }],
        rules: storeRules,
      },
      {
        name: "Retrait en magasin — Bruay-la-Buissière",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        data: { pickup: true },
        type: {
          label: "Retrait magasin",
          description: "Retrait gratuit en magasin, paiement possible sur place.",
          code: "store-pickup",
        },
        prices: [{ currency_code: "eur", amount: 0 }],
        rules: storeRules,
      },
    ],
  });
  logger.info("Created Bleunuit shipping options.");
  logger.info("✅ Bleunuit seed complete.");
}
