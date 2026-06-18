import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

const SECTIONS = [
  {
    to: "/content/homepage",
    title: "Page d'accueil",
    description: "Hero, promo, atouts, méthode et appel à l'action.",
  },
  {
    to: "/content/blog",
    title: "Blog",
    description: "Articles de conseils et actualités.",
  },
  {
    to: "/content/stores",
    title: "Magasins",
    description: "Adresses, horaires et coordonnées des points de vente.",
  },
  {
    to: "/content/testimonials",
    title: "Témoignages",
    description: "Avis clients affichés sur la page d'accueil.",
  },
  {
    to: "/content/brands",
    title: "Marques",
    description: "Marques partenaires affichées sur la page d'accueil et /produits.",
  },
]

// Landing page for the "Contenu" sidebar group: links to each editable
// content section of the storefront.
const ContentIndexPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Contenu du site</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Modifiez le contenu éditable de la vitrine.
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-lg [&:hover>div]:bg-ui-bg-base-hover"
          >
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-4 transition-colors">
              <Text size="small" weight="plus">
                {s.title}
              </Text>
              <Text size="small" className="mt-1 text-ui-fg-subtle">
                {s.description}
              </Text>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Contenu",
  icon: DocumentText,
})

export default ContentIndexPage
