import {
  Button,
  Container,
  Heading,
  Prompt,
  Text,
  Tooltip,
  TooltipProvider,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  FieldInput,
  useDerivedFields,
  type FieldDef,
} from "../../../../components/crud-resource"
import {
  ADDRESS_FIELDS,
  BLOG_FIELDS,
  BODY_FIELDS,
  CLASSIFICATION_FIELDS,
  IMAGE_FIELDS,
  PUBLICATION_FIELDS,
  emptyBlogPost,
} from "../../../../lib/blog-fields"
import { sdk } from "../../../../lib/sdk"

// Injected into the admin bundle by `admin.storefrontUrl` in medusa-config.ts.
// Declared here because it is a build-time constant, not a runtime variable.
declare const __STOREFRONT_URL__: string | undefined

const STOREFRONT_URL =
  typeof __STOREFRONT_URL__ === "string" && __STOREFRONT_URL__
    ? __STOREFRONT_URL__
    : "http://localhost:4321"

const LIST_PATH = "/content/blog"

type BlogPost = { id: string } & Record<string, any>

// Keep only the editable fields: the row also carries id/created_at/… which the
// update endpoint rejects.
function toForm(item: BlogPost) {
  const empty = emptyBlogPost()
  const editable = Object.fromEntries(
    Object.entries(item).filter(([key]) => key in empty)
  )
  return { ...empty, ...editable } as Record<string, any>
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container className="flex flex-col gap-y-4 p-4">
      <Heading level="h3">{title}</Heading>
      {children}
    </Container>
  )
}

function ArticleForm({ item }: { item: BlogPost }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => toForm(item))
  // The last persisted state, to tell an untouched form from a modified one.
  const [saved, setSaved] = useState(form)

  const set = (key: string, v: any) => setForm((f) => ({ ...f, [key]: v }))
  const change = useDerivedFields(BLOG_FIELDS, form, set)

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  const save = useMutation({
    mutationFn: (body: Record<string, any>) =>
      sdk.client.fetch(`/admin/cms/blog-posts/${item.id}`, {
        method: "POST",
        body,
      }),
    onSuccess: (_res, body) => {
      setSaved(body)
      queryClient.invalidateQueries({ queryKey: ["cms-blog-posts"] })
      queryClient.invalidateQueries({ queryKey: ["cms-blog-post", item.id] })
      toast.success("article mis à jour")
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la mise à jour"),
  })

  const submit = () => {
    const missing = BLOG_FIELDS.some(
      (f) => f.required && !String(form[f.key] ?? "").trim()
    )
    if (missing) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }
    save.mutate(form)
  }

  const render = (fields: FieldDef[]) =>
    fields.map((f) => (
      <FieldInput
        key={f.key}
        field={f}
        value={form[f.key]}
        onChange={(v) => change(f, v)}
      />
    ))

  // The public page only exists once the article is published, and it shows the
  // saved version, so both conditions gate the link.
  const viewDisabledReason = !form.published
    ? "Publiez l'article pour le voir sur le site."
    : dirty
      ? "Enregistrez vos modifications pour les voir sur le site."
      : null

  const publicUrl = `${STOREFRONT_URL}/blog/${saved.slug}`

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="flex flex-wrap items-center justify-between gap-2 p-4">
        {dirty ? (
          <Prompt>
            <Prompt.Trigger asChild>
              <Button size="small" variant="secondary">
                Retour à la liste
              </Button>
            </Prompt.Trigger>
            <Prompt.Content>
              <Prompt.Header>
                <Prompt.Title>Modifications non enregistrées</Prompt.Title>
                <Prompt.Description>
                  Si vous quittez cette page maintenant, vos modifications
                  seront perdues.
                </Prompt.Description>
              </Prompt.Header>
              <Prompt.Footer>
                <Prompt.Cancel>Annuler</Prompt.Cancel>
                <Prompt.Action onClick={() => navigate(LIST_PATH)}>
                  Quitter sans enregistrer
                </Prompt.Action>
              </Prompt.Footer>
            </Prompt.Content>
          </Prompt>
        ) : (
          <Button size="small" variant="secondary" asChild>
            <Link to={LIST_PATH}>Retour à la liste</Link>
          </Button>
        )}

        <div className="flex items-center gap-x-2">
          {viewDisabledReason ? (
            <TooltipProvider>
              <Tooltip content={viewDisabledReason}>
                {/* A disabled button fires no events, so the tooltip needs a
                    wrapper that still receives them. */}
                <span tabIndex={0}>
                  <Button size="small" variant="secondary" disabled>
                    Voir sur le site
                  </Button>
                </span>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button size="small" variant="secondary" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                Voir sur le site
              </a>
            </Button>
          )}
          <Button size="small" onClick={submit} isLoading={save.isPending}>
            Enregistrer
          </Button>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Container className="flex flex-col gap-y-4 p-4">
          {render(BODY_FIELDS)}
        </Container>

        <div className="flex flex-col gap-y-4">
          <Panel title="Publication">{render(PUBLICATION_FIELDS)}</Panel>
          <Panel title="Classement">{render(CLASSIFICATION_FIELDS)}</Panel>
          <Panel title="Adresse">{render(ADDRESS_FIELDS)}</Panel>
          <Panel title="Image">{render(IMAGE_FIELDS)}</Panel>
        </div>
      </div>
    </div>
  )
}

// Full-page editor for one article. The list at /content/blog links here
// instead of opening its drawer: an article body needs the room.
const BlogPostPage = () => {
  const { id } = useParams()
  const { data, isLoading, isError } = useQuery<{ item: BlogPost }>({
    queryKey: ["cms-blog-post", id],
    queryFn: () => sdk.client.fetch(`/admin/cms/blog-posts/${id}`),
  })

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Chargement…</Text>
      </Container>
    )
  }

  if (isError || !data?.item) {
    return (
      <Container className="flex flex-col items-start gap-y-4 p-6">
        <Text>Cet article est introuvable.</Text>
        <Button size="small" variant="secondary" asChild>
          <Link to={LIST_PATH}>Retour à la liste</Link>
        </Button>
      </Container>
    )
  }

  // Mount the form only once the article is loaded: its initial state decides
  // whether the slug is already pinned.
  return <ArticleForm item={data.item} />
}

export default BlogPostPage
