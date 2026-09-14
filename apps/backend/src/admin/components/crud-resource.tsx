import {
  Button,
  Container,
  DatePicker,
  Drawer,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Select,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { ImageField } from "./image-field"
import { RichTextField } from "./rich-text-field"
import { sdk } from "../lib/sdk"

// A field in the create/edit form.
export type FieldDef = {
  key: string
  label: string
  type?:
    | "text"
    | "textarea"
    | "number"
    | "boolean"
    | "hours"
    | "image"
    | "richtext"
    | "date"
    | "select"
  placeholder?: string
  required?: boolean
  /** Choices for `type: "select"`. */
  options?: { value: string; label: string }[]
  /** Help text shown under the input. */
  hint?: string
  /** Key of the field this one is derived from, until edited by hand. */
  slugFrom?: string
}

export function slugify(input: string) {
  return input
    .normalize("NFD") // split accented letters into letter + combining mark
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Dates are stored as plain "YYYY-MM-DD" strings. Build them from the local
// calendar fields: toISOString() would shift to the previous day for any French
// evening after 22:00.
function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "")
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

// A column in the list table.
export type ColumnDef<T> = {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

export type CrudResourceProps<T> = {
  /** Backend base path, e.g. "/admin/cms/blog-posts". */
  endpoint: string
  /** react-query cache key, e.g. ["cms-blog-posts"]. */
  queryKey: string[]
  /** Page heading + subtitle. */
  title: string
  subtitle?: string
  /** Singular noun for buttons/toasts, e.g. "article". */
  singular: string
  columns: ColumnDef<T>[]
  fields: FieldDef[]
  /** Blank form values for the create form. */
  emptyItem: Record<string, any>
}

const DAYS: { key: string; label: string }[] = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
]

// Renders one form field based on its type.
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any
  onChange: (v: any) => void
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <Label size="small" weight="plus">
          {field.label}
        </Label>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    )
  }

  if (field.type === "image") {
    return (
      <ImageField label={field.label} value={value ?? ""} onChange={onChange} />
    )
  }

  if (field.type === "richtext") {
    return (
      <RichTextField
        label={field.label}
        value={value ?? ""}
        onChange={onChange}
      />
    )
  }

  if (field.type === "date") {
    return (
      <div className="flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          {field.label}
        </Label>
        <DatePicker
          value={fromIsoDate(value)}
          onChange={(d) => onChange(d ? toIsoDate(d) : "")}
        />
      </div>
    )
  }

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          {field.label}
        </Label>
        <Select value={value ?? ""} onValueChange={onChange}>
          <Select.Trigger>
            <Select.Value placeholder="Choisir…" />
          </Select.Trigger>
          <Select.Content>
            {(field.options ?? []).map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    )
  }

  // Opening hours: one row per interval, so a day with a lunch break simply
  // gets two rows and a day with no row is closed. The storefront renders both
  // the visible table and the schema.org hours from this list.
  if (field.type === "hours") {
    const rows: { day: string; opens: string; closes: string }[] = Array.isArray(value)
      ? value
      : []
    const update = (index: number, patch: Record<string, string>) =>
      onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

    return (
      <div className="flex flex-col gap-y-2">
        <Label size="small" weight="plus">
          {field.label}
        </Label>
        <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base p-3">
          {rows.length === 0 && (
            <Text size="small" className="text-ui-fg-subtle">
              Aucun créneau : le magasin est annoncé fermé toute la semaine.
            </Text>
          )}
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-x-2">
              <select
                className="h-8 rounded-md border border-ui-border-base bg-ui-bg-field px-2 text-sm"
                value={row.day ?? "monday"}
                onChange={(e) => update(index, { day: e.target.value })}
              >
                {DAYS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
              <Input
                type="time"
                value={row.opens ?? ""}
                onChange={(e) => update(index, { opens: e.target.value })}
              />
              <Input
                type="time"
                value={row.closes ?? ""}
                onChange={(e) => update(index, { closes: e.target.value })}
              />
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              >
                Retirer
              </Button>
            </div>
          ))}
          <div>
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={() =>
                onChange([...rows, { day: "monday", opens: "09:30", closes: "12:30" }])
              }
            >
              Ajouter un créneau
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {field.label}
        {field.required && <span className="text-ui-fg-error"> *</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          value={value ?? ""}
          placeholder={field.placeholder}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          type={field.type === "number" ? "number" : "text"}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) =>
            onChange(
              field.type === "number"
                ? e.target.value === ""
                  ? null
                  : Number(e.target.value)
                : e.target.value
            )
          }
        />
      )}
      {field.hint && (
        <Text size="xsmall" className="text-ui-fg-subtle">
          {field.hint}
        </Text>
      )}
    </div>
  )
}

// Shared form body used by both create and edit.
function FormBody({
  fields,
  form,
  set,
}: {
  fields: FieldDef[]
  form: Record<string, any>
  set: (key: string, v: any) => void
}) {
  // A derived field (the slug) follows its source until someone edits it by
  // hand. An existing value counts as edited, so renaming an article never
  // silently changes a published URL.
  const [pinned, setPinned] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      fields.filter((f) => f.slugFrom).map((f) => [f.key, !!form[f.key]])
    )
  )

  const change = (field: FieldDef, v: any) => {
    if (field.slugFrom) {
      setPinned((p) => ({ ...p, [field.key]: true }))
      set(field.key, v)
      return
    }
    set(field.key, v)
    for (const derived of fields) {
      if (derived.slugFrom === field.key && !pinned[derived.key]) {
        set(derived.key, slugify(String(v ?? "")))
      }
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      {fields.map((f) => (
        <FieldInput
          key={f.key}
          field={f}
          value={form[f.key]}
          onChange={(v) => change(f, v)}
        />
      ))}
    </div>
  )
}

export function CrudResource<T extends { id: string }>({
  endpoint,
  queryKey,
  title,
  subtitle,
  singular,
  columns,
  fields,
  emptyItem,
}: CrudResourceProps<T>) {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<T | null>(null)
  const [createForm, setCreateForm] = useState<Record<string, any>>({
    ...emptyItem,
  })
  const [editForm, setEditForm] = useState<Record<string, any>>({})

  const { data, isLoading } = useQuery<{ items: T[] }>({
    queryKey,
    queryFn: () => sdk.client.fetch(endpoint),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey })

  const requiredMissing = (form: Record<string, any>) =>
    fields.some((f) => f.required && !String(form[f.key] ?? "").trim())

  const createMutation = useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch(endpoint, { method: "POST", body }),
    onSuccess: () => {
      invalidate()
      toast.success(`${singular} créé`)
      setCreateOpen(false)
      setCreateForm({ ...emptyItem })
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la création"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, any> }) =>
      sdk.client.fetch(`${endpoint}/${id}`, { method: "POST", body }),
    onSuccess: () => {
      invalidate()
      toast.success(`${singular} mis à jour`)
      setEditItem(null)
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la mise à jour"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`${endpoint}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate()
      toast.success(`${singular} supprimé`)
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la suppression"),
  })

  const startEdit = (item: T) => {
    // Keep only the editable fields: the row also carries id/created_at/… which
    // the update endpoint rejects.
    const editable = Object.fromEntries(
      Object.entries(item).filter(([key]) => key in emptyItem)
    )
    setEditForm({ ...emptyItem, ...editable })
    setEditItem(item)
  }

  const submitCreate = () => {
    if (requiredMissing(createForm)) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }
    createMutation.mutate(createForm)
  }

  const submitEdit = () => {
    if (!editItem) return
    if (requiredMissing(editForm)) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }
    updateMutation.mutate({ id: editItem.id, body: editForm })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{title}</Heading>
          {subtitle && (
            <Text size="small" className="text-ui-fg-subtle">
              {subtitle}
            </Text>
          )}
        </div>
        <Button size="small" onClick={() => setCreateOpen(true)}>
          Créer
        </Button>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text>Chargement…</Text>
        ) : !data?.items?.length ? (
          <Text size="small" className="text-ui-fg-subtle">
            Aucun élément. Cliquez sur « Créer » pour commencer.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                {columns.map((c) => (
                  <Table.HeaderCell key={c.key}>{c.header}</Table.HeaderCell>
                ))}
                <Table.HeaderCell className="text-right">
                  Actions
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.items.map((item) => (
                <Table.Row key={item.id}>
                  {columns.map((c) => (
                    <Table.Cell key={c.key}>
                      {c.render
                        ? c.render(item)
                        : String((item as any)[c.key] ?? "")}
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-x-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => startEdit(item)}
                      >
                        Modifier
                      </Button>
                      <Prompt>
                        <Prompt.Trigger asChild>
                          <Button size="small" variant="transparent">
                            Supprimer
                          </Button>
                        </Prompt.Trigger>
                        <Prompt.Content>
                          <Prompt.Header>
                            <Prompt.Title>Supprimer</Prompt.Title>
                            <Prompt.Description>
                              Cette action est irréversible. Confirmer la
                              suppression ?
                            </Prompt.Description>
                          </Prompt.Header>
                          <Prompt.Footer>
                            <Prompt.Cancel>Annuler</Prompt.Cancel>
                            <Prompt.Action
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              Supprimer
                            </Prompt.Action>
                          </Prompt.Footer>
                        </Prompt.Content>
                      </Prompt>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>

      {/* Create */}
      <FocusModal open={createOpen} onOpenChange={setCreateOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={createMutation.isPending}
                >
                  Annuler
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={submitCreate}
                isLoading={createMutation.isPending}
              >
                Enregistrer
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col overflow-auto">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-4 px-2 py-6">
              <Heading level="h2">Nouveau : {singular}</Heading>
              <FormBody
                fields={fields}
                form={createForm}
                set={(key, v) => setCreateForm((f) => ({ ...f, [key]: v }))}
              />
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/* Edit */}
      <Drawer open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Modifier : {singular}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex-1 overflow-auto">
            <FormBody
              fields={fields}
              form={editForm}
              set={(key, v) => setEditForm((f) => ({ ...f, [key]: v }))}
            />
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={updateMutation.isPending}
                >
                  Annuler
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={submitEdit}
                isLoading={updateMutation.isPending}
              >
                Enregistrer
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
