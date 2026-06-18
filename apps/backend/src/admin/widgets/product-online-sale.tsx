import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Label, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

/**
 * Product-page widget that toggles whether a product is sold online.
 *
 * Writes a boolean `purchasable` flag onto the product's metadata. The
 * storefront reads it (src/utils/catalog-client.ts) to decide between an
 * "Ajouter au panier" CTA (online sale) and a "Demander un devis" CTA
 * (in-store only). Default (unset) = in-store only.
 */
const ProductOnlineSaleWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const [purchasable, setPurchasable] = useState(
    product.metadata?.purchasable === true
  )

  const mutation = useMutation({
    mutationFn: (value: boolean) =>
      sdk.admin.product.update(product.id, {
        metadata: { ...(product.metadata ?? {}), purchasable: value },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      toast.success("Mode de vente mis à jour")
    },
    onError: (e: any) => {
      setPurchasable((v) => !v)
      toast.error(e?.message || "Échec de la mise à jour")
    },
  })

  const onToggle = (value: boolean) => {
    setPurchasable(value)
    mutation.mutate(value)
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Text size="base" weight="plus">
          Vente en ligne
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Activée : le produit est vendu en ligne (panier + paiement carte).
          Désactivée : disponible en magasin uniquement (devis / visite).
        </Text>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <Label size="small" weight="plus">
          Vendu en ligne
        </Label>
        <Switch
          checked={purchasable}
          onCheckedChange={onToggle}
          disabled={mutation.isPending}
        />
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductOnlineSaleWidget
