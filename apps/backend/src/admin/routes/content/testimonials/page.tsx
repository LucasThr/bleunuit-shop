import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CrudResource } from "../../../components/crud-resource"

type Testimonial = {
  id: string
  name: string
  city?: string | null
  rank?: number | null
  published?: boolean
}

const TestimonialsPage = () => (
  <CrudResource<Testimonial>
    endpoint="/admin/cms/testimonials"
    queryKey={["cms-testimonials"]}
    title="Témoignages"
    subtitle="Avis clients affichés sur la page d'accueil."
    singular="témoignage"
    columns={[
      { key: "name", header: "Nom" },
      { key: "city", header: "Ville" },
      { key: "rank", header: "Ordre" },
      {
        key: "published",
        header: "Publié",
        render: (i) => (i.published ? "Oui" : "Non"),
      },
    ]}
    fields={[
      { key: "quote", label: "Citation", type: "textarea", required: true },
      { key: "name", label: "Nom", required: true },
      { key: "city", label: "Ville" },
      { key: "rank", label: "Ordre d'affichage", type: "number" },
      { key: "published", label: "Publié", type: "boolean" },
    ]}
    emptyItem={{
      quote: "",
      name: "",
      city: "",
      rank: null,
      published: true,
    }}
  />
)

export const config = defineRouteConfig({
  label: "Témoignages",
})

export default TestimonialsPage
