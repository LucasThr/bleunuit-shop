import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Container, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type SaleChannel = "online" | "in_store" | "both"

const OPTIONS: { value: SaleChannel; label: string }[] = [
  { value: "online", label: "En ligne uniquement" },
  { value: "in_store", label: "En magasin uniquement" },
  { value: "both", label: "En ligne et en magasin" },
]

/**
 * Product-page widget that sets which channel(s) sell this product.
 *
 * Writes a `sale_channel` enum onto the product's metadata. The storefront
 * reads it (src/utils/catalog-client.ts → saleMode) to choose between an
 * "Ajouter au panier" CTA (online) and a "Demander un devis" CTA (in-store);
 * "both" shows the cart with the devis as a secondary link. Availability
 * (in_stock) is a separate axis: an out-of-stock online product shows a
 * disabled cart, not a devis.
 */
const ProductOnlineSaleWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()

  // Fall back to the legacy `purchasable` boolean for products not yet migrated.
  const initial: SaleChannel =
    (product.metadata?.sale_channel as SaleChannel | undefined) ??
    (product.metadata?.purchasable === true ? "both" : "in_store")
  const [channel, setChannel] = useState<SaleChannel>(initial)

  const mutation = useMutation({
    mutationFn: (value: SaleChannel) => {
      const metadata = { ...(product.metadata ?? {}), sale_channel: value }
      delete (metadata as Record<string, unknown>).purchasable
      return sdk.admin.product.update(product.id, { metadata })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      toast.success("Mode de vente mis à jour")
    },
    onError: (e: any) => {
      setChannel(initial)
      toast.error(e?.message || "Échec de la mise à jour")
    },
  })

  const onChange = (value: string) => {
    const next = value as SaleChannel
    setChannel(next)
    mutation.mutate(next)
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Text size="base" weight="plus">
          Mode de vente
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          En ligne : panier + paiement carte. En magasin : devis / visite. Les
          deux : panier, avec le devis en option.
        </Text>
      </div>
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Label size="small" weight="plus">
          Canal de vente
        </Label>
        <Select
          value={channel}
          onValueChange={onChange}
          disabled={mutation.isPending}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductOnlineSaleWidget
