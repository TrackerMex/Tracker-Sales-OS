import { useEffect, useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import {
  BuildingIcon,
  ChevronLeftIcon,
  EditIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "@/shared/components/Icon"
import { UserRole } from "@/core/domain/types/common.types"
import { PIPELINE_STAGES } from "@/shared/lib/constants"
import { useAppStore } from "@/shared/store/app.store"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import type { Activity } from "@/modules/activities/domain/activities.types"
import { useClients } from "../../application/hooks/useClients"
import { useCreateClient } from "../../application/hooks/useCreateClient"
import { useDeleteClient } from "../../application/hooks/useDeleteClient"
import { useUpdateClient } from "../../application/hooks/useUpdateClient"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useClientDeals } from "@/modules/pipeline/application/hooks/useClientDeals"
import { useChangeStage } from "@/modules/pipeline/application/hooks/useChangeStage"
import { ALLOWED_TRANSITIONS } from "@/modules/pipeline/domain/pipeline.types"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import type { StatusTone } from "@/shared/lib/status"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  Client,
  ClientSource,
  ClientType,
  CreateClientInput,
  CreateContactInput,
  PersonType,
  PipelineStage,
} from "../../domain/clients.types"

const clientTypes: ClientType[] = ["Prospecto", "Nuevo", "Existente"]
const personTypes: PersonType[] = ["Moral", "Física"]
const clientSources: ClientSource[] = [
  "Prospección propia",
  "Cliente existente",
  "Referido",
  "Expo",
  "Marketing",
  "LinkedIn",
  "Web",
  "Dirección Comercial",
]

function qualityTone(quality: number): StatusTone {
  if (quality === 100) return "success"
  return quality < 60 ? "danger" : "pending"
}

const emptyContact: CreateContactInput = {
  name: "",
  role: "",
  phone: "",
  email: "",
  isDecisionMaker: false,
}

function emptyClientForm(sellerId?: string | null): CreateClientInput {
  return {
    name: "",
    domain: "",
    type: "Prospecto",
    person: "Moral",
    sellerId: sellerId ?? "",
    source: "Prospección propia",
    stage: "Prospecto",
    expectedAmount: 0,
    units: 0,
    pain: "",
    provider: "",
    nextStep: "",
    nextDate: "",
    nextTime: "",
    contacts: [{ ...emptyContact }],
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function cleanContact(c: CreateContactInput): CreateContactInput {
  return {
    name: c.name.trim(),
    role: c.role?.trim() || undefined,
    phone: c.phone?.trim() || undefined,
    email: c.email?.trim() || undefined,
    isDecisionMaker: c.isDecisionMaker,
  }
}

type View = { mode: "list" } | { mode: "detail"; clientId: string }

function InfoItem({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  )
}

export function ClientesPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [view, setView] = useState<View>({ mode: "list" })
  const [q, setQ] = useState("")
  const [cold, setCold] = useState(false)
  const [incomplete, setIncomplete] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<CreateClientInput>(() =>
    emptyClientForm(currentUser?.sellerId)
  )

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setView({ mode: "list" }))
    return () => cancelAnimationFrame(frame)
  }, [currentUser?.id])

  const filters = useMemo(
    () => ({
      q,
      limit: 50,
      cold: cold || undefined,
      incomplete: incomplete || undefined,
    }),
    [q, cold, incomplete]
  )

  const { data, isLoading, isError } = useClients(filters)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const {
    summary: saveError,
    fieldErrors,
    clearField,
    formRef,
  } = useApiFormErrors(createClient.error ?? updateClient.error)
  const { data: sellersData } = useSellers()
  const activeSellers = (sellersData ?? []).filter((s) => s.active)
  const canChooseSeller = currentUser?.role !== UserRole.Seller

  const clientList = data?.data ?? []
  const selectedClient =
    view.mode === "detail"
      ? (clientList.find((c) => c.id === view.clientId) ?? null)
      : null

  const { data: clientDeals } = useClientDeals(
    selectedClient?.id ?? null,
    selectedClient?.sellerId ?? null
  )
  // Deals come ordered by createdAt ASC, so the last one is the most recent
  const activeDeal =
    clientDeals && clientDeals.length > 0
      ? clientDeals[clientDeals.length - 1]
      : null
  const changeStage = useChangeStage()

  const sellerId = currentUser?.sellerId ?? currentUser?.id ?? ""
  const { data: sellerActivities } = useQuery({
    queryKey: ["activities", "seller", sellerId],
    queryFn: () => activitiesApi.getSellerActivities(sellerId, { limit: 200 }),
    enabled: !!sellerId && view.mode === "detail",
  })

  const clientActivities: Activity[] = useMemo(() => {
    if (!sellerActivities?.data || !selectedClient) return []
    return sellerActivities.data.filter((a) => a.clientId === selectedClient.id)
  }, [sellerActivities, selectedClient])

  function updateForm<K extends keyof CreateClientInput>(
    key: K,
    value: CreateClientInput[K]
  ) {
    clearField(String(key))
    setForm((cur) => ({ ...cur, [key]: value }))
  }

  function resetSaveErrors() {
    createClient.reset()
    updateClient.reset()
  }

  function openCreate() {
    setEditingClient(null)
    setForm(emptyClientForm(currentUser?.sellerId))
    resetSaveErrors()
    setShowModal(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    resetSaveErrors()
    setForm({
      name: client.name,
      domain: client.domain ?? "",
      type: client.type,
      person: client.person,
      sellerId: client.sellerId,
      source: client.source,
      stage: client.stage,
      expectedAmount: client.expectedAmount,
      units: client.units,
      pain: client.pain ?? "",
      provider: client.provider ?? "",
      nextStep: client.nextStep ?? "",
      nextDate: client.nextDate ?? "",
      nextTime: client.nextTime ?? "",
      contacts: client.contacts.length
        ? client.contacts.map((c) => ({
            name: c.name,
            role: c.role || "",
            phone: c.phone || "",
            email: c.email || "",
            isDecisionMaker: c.isDecisionMaker,
          }))
        : [{ ...emptyContact }],
    })
    setShowModal(true)
  }

  function submitClient(e: FormEvent) {
    e.preventDefault()
    const payload: CreateClientInput = {
      ...form,
      domain: form.domain?.trim() || undefined,
      sellerId: canChooseSeller
        ? form.sellerId || undefined
        : (currentUser?.sellerId ?? undefined),
      expectedAmount: Number(form.expectedAmount ?? 0),
      units: Number(form.units ?? 0),
      contacts: (form.contacts ?? [])
        .filter((c) => c.name.trim().length >= 2)
        .map(cleanContact),
    }

    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, payload },
        {
          onSuccess: () => {
            setShowModal(false)
            toast.success("Cliente actualizado")
          },
          onError: () => toast.error("No se pudo actualizar el cliente"),
        }
      )
    } else {
      createClient.mutate(payload, {
        onSuccess: () => {
          setShowModal(false)
          toast.success("Cliente creado")
        },
        onError: () => toast.error("No se pudo crear el cliente"),
      })
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        toast.success("Cliente eliminado")
        if (view.mode === "detail" && view.clientId === deleteTarget.id) {
          setView({ mode: "list" })
        }
      },
      onError: () => toast.error("No se pudo eliminar el cliente"),
    })
  }

  function handleStageChange(stage: PipelineStage) {
    if (!selectedClient) return
    if (activeDeal) {
      changeStage.mutate(
        {
          dealId: activeDeal.id,
          input: { newStage: stage, changedBy: currentUser?.username ?? "" },
        },
        {
          onSuccess: () => toast.success("Stage actualizado"),
          onError: () => toast.error("No se pudo actualizar el stage"),
        }
      )
    } else {
      updateClient.mutate(
        { id: selectedClient.id, payload: { stage } },
        {
          onSuccess: () => toast.success("Stage actualizado"),
          onError: () => toast.error("No se pudo actualizar el stage"),
        }
      )
    }
  }

  function goToDetail(clientId: string) {
    setView({ mode: "detail", clientId })
  }

  function goToList() {
    setView({ mode: "list" })
  }

  function sellerName(id: string) {
    return activeSellers.find((s) => s.id === id)?.name ?? id.slice(0, 8)
  }

  // --- DETAIL VIEW ---
  if (view.mode === "detail" && selectedClient) {
    return (
      <div>
        <Button variant="ghost" onClick={goToList} className="mb-2 -ml-2.5">
          <ChevronLeftIcon />
          Volver a clientes
        </Button>
        <PageHeader
          title={selectedClient.name}
          description={
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedClient.stage} />
              <StatusBadge tone={qualityTone(selectedClient.dataQuality)}>
                Datos {selectedClient.dataQuality}%
              </StatusBadge>
              {selectedClient.isCold && (
                <StatusBadge tone="danger">Fría</StatusBadge>
              )}
            </span>
          }
          actions={
            <Button onClick={() => openEdit(selectedClient)}>
              <EditIcon />
              Editar cliente
            </Button>
          }
        />

        <div className="grid grid-cols-12 gap-px bg-border p-px">
          <section className="col-span-12 bg-background p-6 lg:col-span-7">
            <h2 className="text-base font-semibold">Datos del cliente</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <InfoItem label="Tipo">{selectedClient.type}</InfoItem>
              <InfoItem label="Vendedor">
                {sellerName(selectedClient.sellerId)}
              </InfoItem>
              <InfoItem label="Proveedor actual">
                {selectedClient.provider || "Sin info"}
              </InfoItem>
              <InfoItem label="Siguiente paso">
                {selectedClient.nextStep || "—"}
                {selectedClient.nextDate && (
                  <span className="block text-muted-foreground">
                    {formatDate(selectedClient.nextDate)}
                    {selectedClient.nextTime
                      ? ` ${selectedClient.nextTime}`
                      : ""}
                  </span>
                )}
              </InfoItem>
              <InfoItem label="Pain / Necesidad" className="sm:col-span-2">
                {selectedClient.pain || "Sin registrarlo"}
              </InfoItem>
            </dl>
          </section>

          <section className="col-span-12 bg-background p-6 lg:col-span-5">
            <h2 className="text-base font-semibold">Contactos</h2>
            {selectedClient.contacts.length > 0 ? (
              <ul className="mt-4 divide-y">
                {selectedClient.contacts.map((c) => (
                  <li key={c.id} className="py-3">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.role || "Sin rol"} {c.phone ? `· ${c.phone}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Sin contactos
              </p>
            )}
          </section>

          <section className="col-span-12 bg-background p-6">
            <h2 className="text-base font-semibold">Actualizar etapa</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((s) => {
                // With a deal, the deal stage is the pipeline source of truth
                const isActive = activeDeal
                  ? activeDeal.stage === s
                  : selectedClient.stage === s
                // The current stage stays enabled (full contrast) but inert.
                const disabled =
                  !isActive &&
                  !!activeDeal &&
                  !ALLOWED_TRANSITIONS[activeDeal.stage].includes(s)
                return (
                  <Button
                    key={s}
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    aria-current={isActive ? "step" : undefined}
                    disabled={disabled}
                    onClick={isActive ? undefined : () => handleStageChange(s)}
                  >
                    {s}
                  </Button>
                )
              })}
            </div>
          </section>

          <section className="col-span-12 bg-background p-6">
            <h2 className="text-base font-semibold">
              Historial de actividad ({clientActivities.length})
            </h2>
            {clientActivities.length === 0 ? (
              <EmptyState
                title="Sin actividades registradas para este cliente"
                description="Las actividades que registres con este cliente aparecerán aquí."
              />
            ) : (
              <ul className="mt-4 max-h-[480px] divide-y overflow-y-auto">
                {clientActivities.map((act) => (
                  <li key={act.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{act.type}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(act.executedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {act.summary}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Resultado:{" "}
                        <b className="font-medium text-foreground">
                          {act.result}
                        </b>
                      </span>
                      <span>
                        Calidad:{" "}
                        <b className="font-medium text-foreground">
                          {act.quality}/5
                        </b>
                      </span>
                      <span>
                        Puntos:{" "}
                        <b className="font-medium text-foreground">
                          {act.points}
                        </b>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Edit modal */}
        {showModal && editingClient && renderModal()}
      </div>
    )
  }

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="max-w-52 min-w-40">
          <button
            type="button"
            onClick={() => goToDetail(row.original.id)}
            className="block max-w-full truncate rounded-sm text-left font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {row.original.name}
          </button>
          <p className="truncate text-muted-foreground">
            {row.original.pain || "Sin pain registrado"}
          </p>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contacto",
      cell: ({ row }) => {
        const contact = row.original.contacts[0]
        if (!contact)
          return <span className="text-muted-foreground">Sin contactos</span>
        return (
          <div className="max-w-40 min-w-32">
            <p className="truncate font-medium">{contact.name}</p>
            {contact.phone && (
              <p className="text-muted-foreground">{contact.phone}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "stage",
      header: "Etapa",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={row.original.stage} />
          {row.original.isCold && <StatusBadge tone="danger">Fría</StatusBadge>}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      // Tipo and Datos also show in the client detail; below 2xl they are
      // hidden so the row (and its actions menu) fits without scrolling.
      meta: { className: "hidden 2xl:table-cell" },
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: "dataQuality",
      header: "Datos",
      meta: { className: "hidden 2xl:table-cell" },
      cell: ({ row }) => (
        <StatusBadge tone={qualityTone(row.original.dataQuality)}>
          {row.original.dataQuality}%
        </StatusBadge>
      ),
    },
    {
      id: "seller",
      header: "Vendedor",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {sellerName(row.original.sellerId)}
        </span>
      ),
    },
    {
      id: "nextStep",
      header: "Siguiente paso",
      cell: ({ row }) => {
        const { nextStep, nextDate } = row.original
        if (!nextStep && !nextDate)
          return <span className="text-muted-foreground">—</span>
        return (
          <div className="max-w-44 min-w-32">
            {nextStep && <p className="truncate">{nextStep}</p>}
            {nextDate && (
              <p className="text-muted-foreground">{formatDate(nextDate)}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "lastActivityAt",
      header: "Última actividad",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {row.original.lastActivityAt
            ? formatDate(row.original.lastActivityAt)
            : "Sin actividad"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      meta: { className: "w-12 text-right" },
      cell: ({ row }) => {
        const client = row.original
        return (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Acciones de ${client.name}`}
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Acciones del cliente</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onSelect={() => openEdit(client)}>
                Editar cliente
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(client)}
              >
                Eliminar cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // --- LIST VIEW ---
  return (
    <div>
      <PageHeader
        title="Clientes"
        description={data ? `${data.total} registros` : "Cartera comercial"}
        actions={
          <Button onClick={openCreate}>
            <PlusIcon />
            Nuevo cliente
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <SectionCard
          title="Cartera comercial"
          icon={<BuildingIcon size={16} />}
        >
          <div className="flex flex-wrap items-center gap-2 border-b p-4">
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente..."
                aria-label="Buscar cliente"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => setCold((v) => !v)}
              variant={cold ? "default" : "outline"}
              aria-pressed={cold}
            >
              Sin contacto
            </Button>
            <Button
              onClick={() => setIncomplete((v) => !v)}
              variant={incomplete ? "default" : "outline"}
              aria-pressed={incomplete}
            >
              Datos incompletos
            </Button>
          </div>

          {isLoading && (
            <div
              className="flex flex-col gap-3 p-4"
              role="status"
              aria-label="Cargando clientes"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="p-4 text-sm text-status-danger">
              No se pudo cargar la cartera.
            </p>
          )}
          {!isLoading &&
            !isError &&
            (clientList.length === 0 ? (
              <EmptyState
                icon={<BuildingIcon size={20} />}
                title="No se encontraron clientes con los filtros seleccionados"
                description="Cambia la búsqueda o quita los filtros para ver más clientes."
              />
            ) : (
              <DataTable
                columns={columns}
                data={clientList}
                getRowId={(c) => c.id}
                onRowClick={(c) => goToDetail(c.id)}
              />
            ))}
        </SectionCard>
      </div>

      {/* Create modal */}
      {showModal && renderModal()}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar <strong>{deleteTarget?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteClient.isError && (
            <p className="text-xs text-status-danger">
              {deleteClient.error instanceof Error
                ? deleteClient.error.message
                : "No se pudo eliminar"}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClient.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
              disabled={deleteClient.isPending}
              variant="destructive"
            >
              {deleteClient.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  // --- SHARED MODAL ---
  function renderModal() {
    const isSaving = createClient.isPending || updateClient.isPending
    return (
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) setShowModal(false)
        }}
      >
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto bg-background p-0 sm:max-w-5xl">
          <DialogHeader className="border-b p-4 md:p-6">
            <DialogTitle>
              {editingClient
                ? "Editar cliente / prospecto"
                : "Nuevo cliente / prospecto"}
            </DialogTitle>
            <DialogDescription>
              Puedes registrar varios contactos: decisor, finanzas, operaciones,
              compras, etc.
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} onSubmit={submitClient}>
            {saveError && (
              <div className="p-4 pb-0 md:px-6">
                <FormErrorSummary error={saveError} />
              </div>
            )}

            <div className="grid gap-px bg-border xl:grid-cols-2">
              <section className="bg-background p-4 md:p-6">
                <h5 className="text-base font-semibold">Cuenta</h5>
                <div className="mt-6 flex flex-col gap-6">
                  <div>
                    <Label htmlFor="client-name">Nombre de la cuenta</Label>
                    <Input
                      id="client-name"
                      required
                      className="mt-2"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Ej: Transportes del Norte"
                      {...fieldErrorProps("name", fieldErrors.name)}
                    />
                    <FieldError name="name" message={fieldErrors.name} />
                  </div>
                  <div>
                    <Label htmlFor="client-domain">Dominio web</Label>
                    <Input
                      id="client-domain"
                      className="mt-2"
                      value={form.domain}
                      onChange={(e) => updateForm("domain", e.target.value)}
                      placeholder="Ej: empresa.com"
                      {...fieldErrorProps("domain", fieldErrors.domain)}
                    />
                    <FieldError name="domain" message={fieldErrors.domain} />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="client-type">Tipo</Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) =>
                          updateForm("type", v as ClientType)
                        }
                      >
                        <SelectTrigger
                          id="client-type"
                          className="mt-2 w-full"
                          {...fieldErrorProps("type", fieldErrors.type)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clientTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="type" message={fieldErrors.type} />
                    </div>
                    <div>
                      <Label htmlFor="client-person">Tipo de persona</Label>
                      <Select
                        value={form.person}
                        onValueChange={(v) =>
                          updateForm("person", v as PersonType)
                        }
                      >
                        <SelectTrigger
                          id="client-person"
                          className="mt-2 w-full"
                          {...fieldErrorProps("person", fieldErrors.person)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {personTypes.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="person" message={fieldErrors.person} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="client-provider">Proveedor actual</Label>
                    <Input
                      id="client-provider"
                      className="mt-2"
                      value={form.provider}
                      onChange={(e) => updateForm("provider", e.target.value)}
                      {...fieldErrorProps("provider", fieldErrors.provider)}
                    />
                    <FieldError
                      name="provider"
                      message={fieldErrors.provider}
                    />
                  </div>
                </div>
              </section>

              <section className="bg-background p-4 md:p-6">
                <h5 className="text-base font-semibold">Oportunidad</h5>
                <div className="mt-6 flex flex-col gap-6">
                  {canChooseSeller && (
                    <div>
                      <Label htmlFor="client-seller">Vendedor</Label>
                      <Select
                        value={form.sellerId}
                        onValueChange={(v) => updateForm("sellerId", v)}
                      >
                        <SelectTrigger
                          id="client-seller"
                          className="mt-2 w-full"
                          {...fieldErrorProps("sellerId", fieldErrors.sellerId)}
                        >
                          <SelectValue placeholder="Seleccionar vendedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSellers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError
                        name="sellerId"
                        message={fieldErrors.sellerId}
                      />
                    </div>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="client-source">Origen</Label>
                      <Select
                        value={form.source}
                        onValueChange={(v) =>
                          updateForm("source", v as ClientSource)
                        }
                      >
                        <SelectTrigger
                          id="client-source"
                          className="mt-2 w-full"
                          {...fieldErrorProps("source", fieldErrors.source)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clientSources.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="source" message={fieldErrors.source} />
                    </div>
                    <div>
                      <Label htmlFor="client-stage">Etapa</Label>
                      <Select
                        value={form.stage}
                        onValueChange={(v) =>
                          updateForm("stage", v as PipelineStage)
                        }
                      >
                        <SelectTrigger
                          id="client-stage"
                          className="mt-2 w-full"
                          {...fieldErrorProps("stage", fieldErrors.stage)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PIPELINE_STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError name="stage" message={fieldErrors.stage} />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="client-units">Unidades potenciales</Label>
                      <Input
                        id="client-units"
                        type="number"
                        min="0"
                        className="mt-2"
                        value={form.units || ""}
                        onChange={(e) =>
                          updateForm("units", Number(e.target.value))
                        }
                        placeholder="0"
                        {...fieldErrorProps("units", fieldErrors.units)}
                      />
                      <FieldError name="units" message={fieldErrors.units} />
                    </div>
                    <div>
                      <Label htmlFor="client-amount">Monto esperado</Label>
                      <Input
                        id="client-amount"
                        type="number"
                        min="0"
                        className="mt-2"
                        value={form.expectedAmount || ""}
                        onChange={(e) =>
                          updateForm("expectedAmount", Number(e.target.value))
                        }
                        placeholder="0"
                        {...fieldErrorProps(
                          "expectedAmount",
                          fieldErrors.expectedAmount
                        )}
                      />
                      <FieldError
                        name="expectedAmount"
                        message={fieldErrors.expectedAmount}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-background p-4 md:p-6 xl:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <h5 className="text-base font-semibold">Contactos</h5>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() =>
                      updateForm("contacts", [
                        ...(form.contacts ?? []),
                        { ...emptyContact },
                      ])
                    }
                    className="h-auto p-0 underline"
                  >
                    Agregar contacto
                  </Button>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  {(form.contacts ?? []).map((contact, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-2 border bg-muted/30 p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.15fr)_auto] xl:items-center"
                    >
                      <Input
                        className="min-w-0"
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...(form.contacts ?? [])]
                          updated[idx] = {
                            ...updated[idx],
                            name: e.target.value,
                          }
                          updateForm("contacts", updated)
                        }}
                        placeholder="Nombre contacto"
                        aria-label={`Nombre del contacto ${idx + 1}`}
                      />
                      <Input
                        className="min-w-0"
                        value={contact.role}
                        onChange={(e) => {
                          const updated = [...(form.contacts ?? [])]
                          updated[idx] = {
                            ...updated[idx],
                            role: e.target.value,
                          }
                          updateForm("contacts", updated)
                        }}
                        placeholder="Rol: decisor, finanzas..."
                        aria-label={`Rol del contacto ${idx + 1}`}
                      />
                      <Input
                        className="min-w-0"
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...(form.contacts ?? [])]
                          updated[idx] = {
                            ...updated[idx],
                            phone: e.target.value,
                          }
                          updateForm("contacts", updated)
                        }}
                        placeholder="Teléfono"
                        aria-label={`Teléfono del contacto ${idx + 1}`}
                      />
                      <Input
                        className="min-w-0"
                        value={contact.email}
                        onChange={(e) => {
                          const updated = [...(form.contacts ?? [])]
                          updated[idx] = {
                            ...updated[idx],
                            email: e.target.value,
                          }
                          updateForm("contacts", updated)
                        }}
                        placeholder="Correo"
                        aria-label={`Correo del contacto ${idx + 1}`}
                      />
                      <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-1">
                        <Label className="cursor-pointer whitespace-nowrap">
                          <Checkbox
                            checked={contact.isDecisionMaker ?? false}
                            onCheckedChange={(checked) => {
                              const updated = [...(form.contacts ?? [])]
                              updated[idx] = {
                                ...updated[idx],
                                isDecisionMaker: checked === true,
                              }
                              updateForm("contacts", updated)
                            }}
                          />
                          Decisor
                        </Label>
                        {(form.contacts?.length ?? 0) > 1 && (
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => {
                              const updated = (form.contacts ?? []).filter(
                                (_, i) => i !== idx
                              )
                              updateForm("contacts", updated)
                            }}
                            className="h-auto p-0 text-status-danger"
                            aria-label={`Quitar contacto ${idx + 1}`}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-background p-4 md:p-6 xl:col-span-2">
                <h5 className="text-base font-semibold">Dolor / necesidad</h5>
                <div className="mt-6 flex flex-col gap-6">
                  <div>
                    <Label htmlFor="client-pain">
                      ¿Por qué crees que Tracker puede ayudarle?
                    </Label>
                    <Textarea
                      id="client-pain"
                      className="mt-2 resize-none"
                      value={form.pain}
                      onChange={(e) => updateForm("pain", e.target.value)}
                      placeholder="Dolor / necesidad detectada"
                      rows={4}
                      {...fieldErrorProps("pain", fieldErrors.pain)}
                    />
                    <FieldError name="pain" message={fieldErrors.pain} />
                  </div>
                  <p className="border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Coach IA:
                    </span>{" "}
                    Un buen registro debe identificar empresa, contactos clave,
                    decisor, teléfono, correo/dominio y razón comercial.
                  </p>
                </div>
              </section>
            </div>

            <div className="flex justify-end border-t p-4 md:px-6">
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving
                  ? "Guardando..."
                  : editingClient
                    ? "Guardar cambios"
                    : "Guardar cliente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
}
