import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { sdk } from "../../../lib/sdk"

type Pair = { title: string; description: string }
type ValueProp = { eyebrow: string; title: string; description: string }

type HomepageForm = {
  hero_badge: string
  hero_location: string
  hero_title: string
  hero_subtitle: string
  hero_image: string
  hero_highlights: Pair[]
  hero_promo_eyebrow: string
  hero_promo_value: string
  hero_promo_label: string
  hero_promo_note: string
  value_props: ValueProp[]
  method_title: string
  method_intro: string
  method_steps: Pair[]
  cta_title: string
  cta_text: string
}

const EMPTY: HomepageForm = {
  hero_badge: "",
  hero_location: "",
  hero_title: "",
  hero_subtitle: "",
  hero_image: "",
  hero_highlights: [],
  hero_promo_eyebrow: "",
  hero_promo_value: "",
  hero_promo_label: "",
  hero_promo_note: "",
  value_props: [],
  method_title: "",
  method_intro: "",
  method_steps: [],
  cta_title: "",
  cta_text: "",
}

const QUERY_KEY = ["cms-homepage"]

// Normalize a homepage row (which may have null fields) into form state.
function toForm(hp: Partial<HomepageForm> | null): HomepageForm {
  if (!hp) return { ...EMPTY }
  return {
    ...EMPTY,
    ...hp,
    hero_highlights: (hp.hero_highlights as Pair[]) ?? [],
    value_props: (hp.value_props as ValueProp[]) ?? [],
    method_steps: (hp.method_steps as Pair[]) ?? [],
  } as HomepageForm
}

// --- Small field helpers ---------------------------------------------------

const Field = ({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  placeholder?: string
}) => (
  <div className="flex flex-col gap-y-2">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {textarea ? (
      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
)

// Repeatable list of objects with a fixed set of string sub-fields.
function ListEditor<T extends Record<string, string>>({
  title,
  items,
  fields,
  blank,
  onChange,
}: {
  title: string
  items: T[]
  fields: { key: keyof T; label: string; textarea?: boolean }[]
  blank: T
  onChange: (items: T[]) => void
}) {
  const update = (i: number, key: keyof T, v: string) => {
    const next = items.map((it, idx) =>
      idx === i ? { ...it, [key]: v } : it
    )
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, { ...blank }])

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {title}
        </Text>
        <Button size="small" variant="secondary" onClick={add}>
          Ajouter
        </Button>
      </div>
      {items.length === 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          Aucun élément.
        </Text>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base p-3"
        >
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              #{i + 1}
            </Text>
            <Button
              size="small"
              variant="transparent"
              onClick={() => remove(i)}
            >
              Supprimer
            </Button>
          </div>
          {fields.map((f) => (
            <Field
              key={String(f.key)}
              label={f.label}
              value={item[f.key]}
              textarea={f.textarea}
              onChange={(v) => update(i, f.key, v)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-y-4 px-6 py-4">
    <Heading level="h2">{title}</Heading>
    {children}
  </div>
)

// --- Page ------------------------------------------------------------------

const HomepageContentPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<HomepageForm>(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      sdk.client.fetch<{ homepage: Partial<HomepageForm> | null }>(
        "/admin/cms/homepage"
      ),
  })

  useEffect(() => {
    if (data) setForm(toForm(data.homepage))
  }, [data])

  const save = useMutation({
    mutationFn: (body: HomepageForm) =>
      sdk.client.fetch("/admin/cms/homepage", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Page d'accueil enregistrée")
    },
    onError: (e: any) =>
      toast.error(e?.message || "Échec de l'enregistrement"),
  })

  const set = <K extends keyof HomepageForm>(key: K, v: HomepageForm[K]) =>
    setForm((f) => ({ ...f, [key]: v }))

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Chargement…</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Page d'accueil</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Contenu éditable de la page d'accueil du site.
          </Text>
        </div>
        <Button
          size="small"
          onClick={() => save.mutate(form)}
          isLoading={save.isPending}
          disabled={save.isPending}
        >
          Enregistrer
        </Button>
      </div>

      <Section title="Hero">
        <Field
          label="Badge"
          value={form.hero_badge}
          onChange={(v) => set("hero_badge", v)}
        />
        <Field
          label="Localisation"
          value={form.hero_location}
          onChange={(v) => set("hero_location", v)}
        />
        <Field
          label="Titre"
          value={form.hero_title}
          onChange={(v) => set("hero_title", v)}
        />
        <Field
          label="Sous-titre"
          textarea
          value={form.hero_subtitle}
          onChange={(v) => set("hero_subtitle", v)}
        />
        <Field
          label="Image (URL)"
          value={form.hero_image}
          placeholder="https://… (laisser vide pour l'image par défaut)"
          onChange={(v) => set("hero_image", v)}
        />
        <ListEditor
          title="Points forts"
          items={form.hero_highlights}
          fields={[
            { key: "title", label: "Titre" },
            { key: "description", label: "Description", textarea: true },
          ]}
          blank={{ title: "", description: "" }}
          onChange={(items) => set("hero_highlights", items)}
        />
      </Section>

      <Section title="Promo (hero)">
        <Field
          label="Sur-titre"
          value={form.hero_promo_eyebrow}
          onChange={(v) => set("hero_promo_eyebrow", v)}
        />
        <Field
          label="Valeur"
          value={form.hero_promo_value}
          placeholder="-40%"
          onChange={(v) => set("hero_promo_value", v)}
        />
        <Field
          label="Libellé"
          value={form.hero_promo_label}
          onChange={(v) => set("hero_promo_label", v)}
        />
        <Field
          label="Note"
          textarea
          value={form.hero_promo_note}
          onChange={(v) => set("hero_promo_note", v)}
        />
      </Section>

      <Section title="Atouts">
        <ListEditor
          title="Blocs"
          items={form.value_props}
          fields={[
            { key: "eyebrow", label: "Sur-titre" },
            { key: "title", label: "Titre" },
            { key: "description", label: "Description", textarea: true },
          ]}
          blank={{ eyebrow: "", title: "", description: "" }}
          onChange={(items) => set("value_props", items)}
        />
      </Section>

      <Section title="Méthode">
        <Field
          label="Titre"
          value={form.method_title}
          onChange={(v) => set("method_title", v)}
        />
        <Field
          label="Introduction"
          textarea
          value={form.method_intro}
          onChange={(v) => set("method_intro", v)}
        />
        <ListEditor
          title="Étapes"
          items={form.method_steps}
          fields={[
            { key: "title", label: "Titre" },
            { key: "description", label: "Description", textarea: true },
          ]}
          blank={{ title: "", description: "" }}
          onChange={(items) => set("method_steps", items)}
        />
      </Section>

      <Section title="Appel à l'action">
        <Field
          label="Titre"
          value={form.cta_title}
          onChange={(v) => set("cta_title", v)}
        />
        <Field
          label="Texte"
          textarea
          value={form.cta_text}
          onChange={(v) => set("cta_text", v)}
        />
      </Section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Page d'accueil",
})

export default HomepageContentPage
