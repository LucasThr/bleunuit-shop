import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import CmsModuleService from "../modules/cms/service"
import updateHomepageWorkflow from "../workflows/update-homepage"
import updateContactWorkflow from "../workflows/update-contact"
import { createBlogPostWorkflow } from "../workflows/blog-post"
import { createStoreWorkflow } from "../workflows/store"
import { createTestimonialWorkflow } from "../workflows/testimonial"
import { blogPosts, stores, testimonials } from "./data/cms-content"

/**
 * Seeds the storefront CMS content (homepage singleton + blog/stores/
 * testimonials collections) with the data captured from the old Directus
 * instance, so the storefront renders identically after the switch.
 *
 * Idempotent per-collection: each section is skipped if it already holds
 * rows, so the seed never clobbers content edited from the admin.
 *
 * Run with:  npx medusa exec ./src/scripts/seed-cms.ts
 */
export default async function seedCms({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cms: CmsModuleService = container.resolve(CMS_MODULE)

  // --- Homepage (singleton) -------------------------------------------------
  const [existingHomepage] = await cms.listHomepages({}, { take: 1 })
  if (existingHomepage) {
    logger.info("[seed-cms] Homepage already exists — skipping.")
  } else {
    await updateHomepageWorkflow(container).run({
      input: {
        hero_badge: "Depuis 1994",
        hero_location: "Bruay-la-Buissière",
        hero_title: "Votre plus belle nuit commence en magasin.",
        hero_subtitle:
          "Matelas, sommiers et accessoires à essayer en conditions réelles. Nos conseillers vous guident vers la literie adaptée à votre posture, vos habitudes et votre budget.",
        hero_image: null,
        hero_highlights: [
          {
            title: "Conseils personnalisés",
            description: "Analyse de vos habitudes de sommeil.",
          },
          {
            title: "Essais confort guidés",
            description: "Testez plusieurs technologies en magasin.",
          },
          {
            title: "Livraison & reprise",
            description: "Une solution complète selon vos besoins.",
          },
        ],
        hero_promo_eyebrow: "Offre exclusive",
        hero_promo_value: "-40%",
        hero_promo_label:
          "sur une sélection de matelas, sommiers et oreillers",
        hero_promo_note:
          "En ce moment dans notre magasin de Bruay-la-Buissière. Conditions en magasin.",
        value_props: [
          {
            eyebrow: "Savoir-faire",
            title: "30 ans d'expertise locale.",
            description:
              "Nos conseillers accompagnent chaque profil de dormeur pour un choix durable et adapté à vos habitudes.",
          },
          {
            eyebrow: "Sélection rigoureuse",
            title: "Des marques reconnues.",
            description:
              "Technologies hybrides, ressorts ensachés, mousses haute résilience: nous filtrons le meilleur.",
          },
          {
            eyebrow: "Expérience magasin",
            title: "Essayez avant de choisir.",
            description:
              "Des espaces dédiés au confort pour ressentir la différence et comparer avec l'aide de nos experts.",
          },
        ],
        method_title: "Un parcours simple, guidé par l'humain.",
        method_intro:
          "Un achat literie, ça se vit. Nous vous guidons et simplifions chaque étape, de l'essai au suivi.",
        method_steps: [
          {
            title: "Écoute et diagnostic",
            description:
              "Nous analysons votre position de sommeil, vos douleurs et vos préférences de fermeté.",
          },
          {
            title: "Sélection accompagnée",
            description:
              "Essayez plusieurs conforts et comparez les technologies en conditions réelles.",
          },
          {
            title: "Livraison et suivi",
            description:
              "Nous organisons la livraison, la reprise et restons disponibles après installation.",
          },
        ],
        cta_title: "Besoin de conseils personnalisés ?",
        cta_text:
          "Notre équipe vous accueille en magasin pour choisir la literie qui soutient vraiment votre sommeil.",
      },
    })
    logger.info("[seed-cms] Homepage content seeded.")
  }

  // --- Contact (singleton) --------------------------------------------------
  const [existingContact] = await cms.listContacts({}, { take: 1 })
  if (existingContact) {
    logger.info("[seed-cms] Contact already exists — skipping.")
  } else {
    await updateContactWorkflow(container).run({
      input: {
        store_name: "Bruay-la-Buissière",
        address: "Centre Commercial Auchan\n62700 Bruay-la-Buissière",
        phone: "03 21 53 21 45",
        email: "contact@bleunuit.fr",
        hours: [
          { label: "Lundi - Vendredi", value: "9h30 - 12h30 / 14h - 19h" },
          { label: "Samedi", value: "9h30 - 19h" },
          { label: "Dimanche", value: "Fermé" },
        ],
      },
    })
    logger.info("[seed-cms] Contact content seeded.")
  }

  // --- Blog posts (collection) ---------------------------------------------
  const blogCount = await cms.listBlogPosts({}, { take: 1 })
  if (blogCount.length) {
    logger.info("[seed-cms] Blog posts already exist — skipping.")
  } else {
    for (const post of blogPosts) {
      await createBlogPostWorkflow(container).run({ input: post })
    }
    logger.info(`[seed-cms] Seeded ${blogPosts.length} blog posts.`)
  }

  // --- Stores (collection) --------------------------------------------------
  const storeCount = await cms.listStores({}, { take: 1 })
  if (storeCount.length) {
    logger.info("[seed-cms] Stores already exist — skipping.")
  } else {
    for (const store of stores) {
      await createStoreWorkflow(container).run({ input: store })
    }
    logger.info(`[seed-cms] Seeded ${stores.length} stores.`)
  }

  // --- Testimonials (collection) -------------------------------------------
  const testimonialCount = await cms.listTestimonials({}, { take: 1 })
  if (testimonialCount.length) {
    logger.info("[seed-cms] Testimonials already exist — skipping.")
  } else {
    for (const testimonial of testimonials) {
      await createTestimonialWorkflow(container).run({ input: testimonial })
    }
    logger.info(`[seed-cms] Seeded ${testimonials.length} testimonials.`)
  }

  logger.info("[seed-cms] CMS content seed complete.")
}
