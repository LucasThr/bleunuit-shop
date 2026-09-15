import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import {
  Button,
  Checkbox,
  Container,
  Label,
  Prompt,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"
import { DIMENSION_GROUPS, OPTION_TITLE } from "../lib/dimension-presets"

/**
 * Declares the product's `Dimensions` option from a preset of standard sizes,
 * so the sizes are picked once instead of retyped on every product.
 *
 * It only declares the option and its values — variants and their prices are
 * created afterwards in Medusa's own variant screen, which then offers these
 * sizes as a list. Replacing an existing option means dropping the variants
 * pinned to the values that disappear, so that path asks for confirmation.
 */
const ProductDimensionsWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const queryClient = useQueryClient()
  const options = product.options ?? []
  const variants = product.variants ?? []
  const existing = options[0]

  // Pre-tick the sizes the product already declares, so re-opening the widget
  // shows its current state rather than an empty form.
  const [selected, setSelected] = useState<string[]>(
    existing?.title === OPTION_TITLE
      ? (existing.values ?? []).map((v) => v.value)
      : []
  )

  const mutation = useMutation({
    mutationFn: async () => {
      // Variants pin option values, so they must go before the values do.
      for (const variant of variants) {
        await sdk.admin.product.deleteVariant(product.id, variant.id)
      }
      const body = { title: OPTION_TITLE, values: selected }
      return existing
        ? sdk.admin.product.updateOption(product.id, existing.id, body)
        : sdk.admin.product.createOption(product.id, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      toast.success(
        `Option ${OPTION_TITLE} enregistrée. Créez maintenant les variantes et leurs prix.`
      )
    },
    onError: (e: any) => {
      toast.error(e?.message || "Échec de l'enregistrement")
    },
  })

  function toggle(value: string) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    )
  }

  // More than one option is a shape this preset can't express; Medusa's own
  // screen handles it.
  if (options.length > 1) {
    return (
      <Container className="p-0">
        <div className="px-6 py-4">
          <Text size="base" weight="plus">
            {OPTION_TITLE}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Ce produit a plusieurs options. Modifiez-les dans la section
            « Options » ci-dessus.
          </Text>
        </div>
      </Container>
    )
  }

  const destructive = variants.length > 0
  const disabled = selected.length === 0 || mutation.isPending

  // Same button either way; when variants are at stake it opens the prompt
  // instead of saving directly, so it takes its click handler from the caller.
  const applyButton = (onClick?: () => void) => (
    <Button variant="secondary" disabled={disabled} onClick={onClick}>
      Enregistrer les dimensions
    </Button>
  )

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Text size="base" weight="plus">
          {OPTION_TITLE}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Cochez les tailles vendues, puis créez les variantes et leurs prix
          dans la section « Variantes ».
        </Text>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4">
        {DIMENSION_GROUPS.map((group) => (
          <div key={group.label}>
            <Text size="small" weight="plus" className="mb-2">
              {group.label}
            </Text>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {group.values.map((value) => {
                const id = `${group.label}-${value}`
                return (
                  <div key={id} className="flex items-center gap-x-2">
                    <Checkbox
                      id={id}
                      checked={selected.includes(value)}
                      onCheckedChange={() => toggle(value)}
                    />
                    <Label htmlFor={id} size="small" weight="plus">
                      {value}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {selected.length} taille{selected.length > 1 ? "s" : ""}{" "}
          sélectionnée{selected.length > 1 ? "s" : ""}
        </Text>
        {destructive ? (
          <Prompt>
            <Prompt.Trigger asChild>{applyButton()}</Prompt.Trigger>
            <Prompt.Content>
              <Prompt.Header>
                <Prompt.Title>Remplacer les variantes existantes ?</Prompt.Title>
                <Prompt.Description>
                  {variants.length} variante
                  {variants.length > 1 ? "s" : ""} de ce produit et leur prix
                  seront supprimées définitivement. Vous devrez recréer les
                  variantes et saisir leurs prix. Cette action est irréversible.
                </Prompt.Description>
              </Prompt.Header>
              <Prompt.Footer>
                <Prompt.Cancel>Annuler</Prompt.Cancel>
                <Prompt.Action onClick={() => mutation.mutate()}>
                  Supprimer et enregistrer
                </Prompt.Action>
              </Prompt.Footer>
            </Prompt.Content>
          </Prompt>
        ) : (
          applyButton(() => mutation.mutate())
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDimensionsWidget
