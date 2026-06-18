import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Prompt,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type QuoteRequest = {
  id: string
  name: string
  email: string
  phone?: string | null
  message?: string | null
  product_id?: string | null
  product_title?: string | null
  status: "pending" | "handled"
  created_at: string
}

const QUERY_KEY = ["quotes"]

const DevisPage = () => {
  const queryClient = useQueryClient()
  const [detail, setDetail] = useState<QuoteRequest | null>(null)

  const { data, isLoading } = useQuery<{ items: QuoteRequest[] }>({
    queryKey: QUERY_KEY,
    queryFn: () => sdk.client.fetch("/admin/quotes"),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteRequest["status"] }) =>
      sdk.client.fetch(`/admin/quotes/${id}`, {
        method: "POST",
        body: { status },
      }),
    onSuccess: () => {
      invalidate()
      toast.success("Statut mis à jour")
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la mise à jour"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/quotes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate()
      toast.success("Demande supprimée")
    },
    onError: (e: any) => toast.error(e?.message || "Échec de la suppression"),
  })

  const items = data?.items ?? []

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Demandes de devis</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Devis envoyés depuis la fiche produit pour les articles vendus en
          magasin uniquement.
        </Text>
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text>Chargement…</Text>
        ) : !items.length ? (
          <Text size="small" className="text-ui-fg-subtle">
            Aucune demande de devis pour le moment.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Nom</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Produit</Table.HeaderCell>
                <Table.HeaderCell>Statut</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  Actions
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{formatDate(item.created_at)}</Table.Cell>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.email}</Table.Cell>
                  <Table.Cell>{item.product_title ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={item.status === "handled" ? "green" : "orange"}
                    >
                      {item.status === "handled" ? "Traité" : "En attente"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center justify-end gap-x-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setDetail(item)}
                      >
                        Détails
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            id: item.id,
                            status:
                              item.status === "handled" ? "pending" : "handled",
                          })
                        }
                      >
                        {item.status === "handled"
                          ? "Rouvrir"
                          : "Marquer traité"}
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

      <Drawer open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Demande de devis</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 overflow-auto">
            {detail && (
              <>
                <Field label="Nom" value={detail.name} />
                <Field label="Email" value={detail.email} />
                <Field label="Téléphone" value={detail.phone || "—"} />
                <Field label="Produit" value={detail.product_title || "—"} />
                <div className="flex flex-col gap-y-1">
                  <Text size="small" weight="plus">
                    Message
                  </Text>
                  <Text
                    size="small"
                    className="whitespace-pre-wrap text-ui-fg-subtle"
                  >
                    {detail.message || "—"}
                  </Text>
                </div>
              </>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-y-1">
    <Text size="small" weight="plus">
      {label}
    </Text>
    <Text size="small" className="text-ui-fg-subtle">
      {value}
    </Text>
  </div>
)

export const config = defineRouteConfig({
  label: "Devis",
  icon: ChatBubbleLeftRight,
})

export default DevisPage
