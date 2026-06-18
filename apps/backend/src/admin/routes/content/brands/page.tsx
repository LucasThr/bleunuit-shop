import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CrudResource } from "../../../components/crud-resource"

type Brand = {
  id: string
  name: string
  slug: string
  rank?: number | null
}

const BrandsPage = () => (
  <CrudResource<Brand>
    endpoint="/admin/cms/brands"
    queryKey={["cms-brands"]}
    title="Marques"
    subtitle="Marques partenaires affichées sur la page d'accueil et /produits."
    singular="marque"
    columns={[
      { key: "name", header: "Nom" },
      { key: "slug", header: "Slug" },
      { key: "rank", header: "Ordre" },
    ]}
    fields={[
      { key: "name", label: "Nom", required: true },
      { key: "slug", label: "Slug", required: true, placeholder: "simmons" },
      { key: "logo", label: "Logo (URL)" },
      { key: "website", label: "Site web" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "rank", label: "Ordre d'affichage", type: "number" },
    ]}
    emptyItem={{
      name: "",
      slug: "",
      logo: "",
      website: "",
      description: "",
      rank: null,
    }}
  />
)

export const config = defineRouteConfig({
  label: "Marques",
})

export default BrandsPage
