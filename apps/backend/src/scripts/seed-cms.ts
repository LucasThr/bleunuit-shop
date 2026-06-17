import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import CmsModuleService from "../modules/cms/service"
import updateHomepageWorkflow from "../workflows/update-homepage"

/**
 * Seeds the storefront homepage content with the French defaults that the
 * Astro storefront previously hardcoded as fallbacks (see
 * directus/src/pages/index.astro). Idempotent: skips if a homepage row
 * already exists, so it never clobbers content edited from the admin.
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

  const [existing] = await cms.listHomepages({}, { take: 1 })
  if (existing) {
    logger.info("[seed-cms] Homepage already exists — skipping.")
    return
  }

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
