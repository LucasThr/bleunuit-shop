import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CrudResource } from "../../../components/crud-resource"

type Store = {
  id: string
  name: string
  city?: string | null
  phone?: string | null
}

const StoresPage = () => (
  <CrudResource<Store>
    endpoint="/admin/cms/stores"
    queryKey={["cms-stores"]}
    title="Magasins"
    subtitle="Points de vente affichés sur /magasins et la page d'accueil."
    singular="magasin"
    columns={[
      { key: "name", header: "Nom" },
      { key: "city", header: "Ville" },
      { key: "phone", header: "Téléphone" },
    ]}
    fields={[
      { key: "name", label: "Nom", required: true },
      {
        key: "slug",
        label: "Slug (URL)",
        required: true,
        placeholder: "bruay-la-buissiere",
      },
      { key: "address", label: "Adresse" },
      { key: "city", label: "Ville" },
      { key: "postal_code", label: "Code postal" },
      { key: "phone", label: "Téléphone" },
      { key: "email", label: "E-mail" },
      { key: "hours", label: "Horaires", type: "days" },
      { key: "map_url", label: "Lien itinéraire (Google Maps)" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "additional_info", label: "Informations complémentaires", type: "textarea" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image (URL)" },
    ]}
    emptyItem={{
      name: "",
      slug: "",
      address: "",
      city: "",
      postal_code: "",
      phone: "",
      email: "",
      hours: {},
      map_url: "",
      latitude: null,
      longitude: null,
      additional_info: "",
      description: "",
      image: "",
    }}
  />
)

export const config = defineRouteConfig({
  label: "Magasins",
})

export default StoresPage
