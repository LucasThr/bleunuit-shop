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

type HoursRow = { label: string; value: string }

type ContactForm = {
  store_name: string
  address: string
  phone: string
  email: string
  hours: HoursRow[]
}

const EMPTY: ContactForm = {
  store_name: "",
  address: "",
  phone: "",
  email: "",
  hours: [],
}

const QUERY_KEY = ["cms-contact"]

// Normalize a contact row (which may have null fields) into form state.
function toForm(c: Partial<ContactForm> | null): ContactForm {
  if (!c) return { ...EMPTY }
  return {
    ...EMPTY,
    ...c,
    hours: (c.hours as HoursRow[]) ?? [],
  } as ContactForm
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
    const next = items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it))
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
            <Button size="small" variant="transparent" onClick={() => remove(i)}>
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

const ContactContentPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ContactForm>(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      sdk.client.fetch<{ contact: Partial<ContactForm> | null }>(
        "/admin/cms/contact"
      ),
  })

  useEffect(() => {
    if (data) setForm(toForm(data.contact))
  }, [data])

  const save = useMutation({
    mutationFn: (body: ContactForm) =>
      sdk.client.fetch("/admin/cms/contact", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Page contact enregistrée")
    },
    onError: (e: any) => toast.error(e?.message || "Échec de l'enregistrement"),
  })

  const set = <K extends keyof ContactForm>(key: K, v: ContactForm[K]) =>
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
          <Heading>Contact</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Coordonnées et horaires affichés sur la page contact.
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

      <Section title="Coordonnées">
        <Field
          label="Nom du magasin"
          value={form.store_name}
          onChange={(v) => set("store_name", v)}
        />
        <Field
          label="Adresse"
          textarea
          value={form.address}
          placeholder={"Centre Commercial Auchan\n62700 Bruay-la-Buissière"}
          onChange={(v) => set("address", v)}
        />
        <Field
          label="Téléphone"
          value={form.phone}
          placeholder="03 21 53 21 45"
          onChange={(v) => set("phone", v)}
        />
        <Field
          label="Email"
          value={form.email}
          placeholder="contact@bleunuit.fr"
          onChange={(v) => set("email", v)}
        />
      </Section>

      <Section title="Horaires d'ouverture">
        <ListEditor
          title="Lignes"
          items={form.hours}
          fields={[
            { key: "label", label: "Jour(s)" },
            { key: "value", label: "Horaire" },
          ]}
          blank={{ label: "", value: "" }}
          onChange={(items) => set("hours", items)}
        />
      </Section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Contact",
})

export default ContactContentPage
