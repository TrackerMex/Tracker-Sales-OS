import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"
import { UserRole } from "@/core/domain/types/common.types"
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
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
const pipelineStages: PipelineStage[] = [
  "Prospecto",
  "Contactado",
  "Interesado",
  "Propuesta",
  "Negociación",
  "Cierre",
  "Perdido",
]
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

const stageBadgeVariant: Record<PipelineStage, BadgeVariant> = {
  Prospecto: "gray",
  Contactado: "navy",
  Interesado: "navy",
  Propuesta: "amber",
  Negociación: "amber",
  Cierre: "green",
  Perdido: "red",
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

  // --- DETAIL VIEW ---
  if (view.mode === "detail" && selectedClient) {
    return (
      <div className="space-y-4 p-6">
        <Button variant="ghost" onClick={goToList}>
          ← Volver a clientes
        </Button>

        <div className="grid grid-cols-[280px_1fr] gap-5">
          {/* Left sidebar */}
          <div className="space-y-5 rounded-xl bg-tracker-dark p-5">
            <div>
              <h2 className="text-lg font-bold text-white">
                {selectedClient.name}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={stageBadgeVariant[selectedClient.stage]}>
                  {selectedClient.stage}
                </Badge>
                <Badge
                  variant={
                    selectedClient.dataQuality === 100
                      ? "green"
                      : selectedClient.dataQuality < 60
                        ? "red"
                        : "amber"
                  }
                >
                  Datos {selectedClient.dataQuality}%
                </Badge>
                <span className="text-[11px] text-slate-400">
                  Seller {selectedClient.sellerId.slice(0, 8)}
                </span>
              </div>
            </div>

            <div>
              <p className="slabel text-slate-400">Contactos</p>
              <div className="mt-2 space-y-2">
                {selectedClient.contacts.length > 0 ? (
                  selectedClient.contacts.map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-sm font-semibold text-white">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {c.role || "Sin rol"} {c.phone ? `· ${c.phone}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Sin contactos</p>
                )}
              </div>
            </div>

            <div>
              <p className="slabel text-slate-400">Pain / Necesidad</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {selectedClient.pain || "Sin registrarlo"}
              </p>
            </div>

            <div>
              <p className="slabel text-slate-400">Proveedor actual</p>
              <p className="mt-1 text-xs text-slate-300">
                {selectedClient.provider || "Sin info"}
              </p>
            </div>

            <div>
              <p className="slabel text-slate-400">Siguiente paso</p>
              <p className="mt-1 text-xs text-slate-300">
                {selectedClient.nextStep || "—"}
              </p>
              {selectedClient.nextDate && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {formatDate(selectedClient.nextDate)}
                  {selectedClient.nextTime ? ` ${selectedClient.nextTime}` : ""}
                </p>
              )}
            </div>

            <div className="border-t border-white/10 pt-2">
              <p className="slabel mb-2 text-slate-400">Registrar avance</p>
              <Button
                onClick={() => openEdit(selectedClient)}
                variant="success"
                className="w-full justify-center"
              >
                Editar cliente
              </Button>
            </div>
          </div>

          {/* Right content */}
          <div className="space-y-5">
            {/* Stage update */}
            <Card className="p-5">
              <p className="slabel mb-3">Actualizar stage</p>
              <div className="flex flex-wrap gap-2">
                {pipelineStages.map((s) => {
                  // With a deal, the deal stage is the pipeline source of truth
                  const isActive = activeDeal
                    ? activeDeal.stage === s
                    : selectedClient.stage === s
                  const disabled = activeDeal
                    ? isActive ||
                      !ALLOWED_TRANSITIONS[activeDeal.stage].includes(s)
                    : false
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={isActive ? "default" : "secondary"}
                      disabled={disabled}
                      onClick={() => handleStageChange(s)}
                    >
                      {s}
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Activity history */}
            <Card className="p-5">
              <p className="slabel mb-3">
                Historial de actividad ({clientActivities.length})
              </p>
              {clientActivities.length === 0 ? (
                <div className="empty-state">
                  Sin actividades registradas para este cliente
                </div>
              ) : (
                <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                  {clientActivities.map((act) => (
                    <div key={act.id} className="log-card">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#002B49]">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(act.executedAt)}
                        </span>
                      </div>
                      <p className="mb-1 text-xs text-slate-600">
                        {act.summary}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span>
                          Resultado:{" "}
                          <b className="text-slate-600">{act.result}</b>
                        </span>
                        <span>
                          Calidad:{" "}
                          <b className="text-slate-600">{act.quality}/5</b>
                        </span>
                        <span>
                          Puntos: <b className="text-slate-600">{act.points}</b>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Edit modal */}
        {showModal && editingClient && renderModal()}
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#002B49]">
            Clientes / Prospectos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.total} registros` : "Cartera comercial"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente..."
            className="max-w-[360px]"
          />
          <Button
            onClick={() => setCold((v) => !v)}
            variant={cold ? "default" : "ghost"}
            className="whitespace-nowrap"
          >
            Sin contacto
          </Button>
          <Button
            onClick={() => setIncomplete((v) => !v)}
            variant={incomplete ? "default" : "ghost"}
            className="whitespace-nowrap"
          >
            Datos incompletos
          </Button>
          <Button onClick={openCreate} className="whitespace-nowrap">
            + Nuevo cliente
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-400">Cargando clientes...</p>
      )}
      {isError && (
        <p className="text-sm text-red-600">No se pudo cargar la cartera.</p>
      )}

      {/* Client grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {clientList.map((client) => (
          <Card
            key={client.id}
            className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Button
                  variant="link"
                  onClick={() => goToDetail(client.id)}
                  className="h-auto p-0 text-sm font-bold text-tracker-blue"
                >
                  {client.name}
                </Button>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="gray" className="text-[9px]">
                  {client.type}
                </Badge>
                <Badge
                  variant={stageBadgeVariant[client.stage]}
                  className="text-[9px]"
                >
                  {client.stage}
                </Badge>
                {client.isCold && (
                  <Badge variant="red" className="text-[9px]">
                    Fría
                  </Badge>
                )}
                <Badge
                  variant={
                    client.dataQuality === 100
                      ? "green"
                      : client.dataQuality < 60
                        ? "red"
                        : "amber"
                  }
                  className="text-[9px]"
                >
                  Datos {client.dataQuality}%
                </Badge>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                {client.pain || "Sin pain registrado"}
              </p>
              {client.contacts.length > 0 && (
                <p className="mt-1 text-[11px] text-tracker-text-secondary">
                  {client.contacts[0].name}
                  {client.contacts[0].phone
                    ? ` · ${client.contacts[0].phone}`
                    : ""}
                </p>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="text-[11px] text-slate-400">
                <span>
                  {activeSellers.find((s) => s.id === client.sellerId)?.name ??
                    client.sellerId.slice(0, 8)}
                </span>
                {client.nextDate && (
                  <span> · {formatDate(client.nextDate)}</span>
                )}
                {client.nextStep && (
                  <span>
                    {" "}
                    · {client.nextStep.slice(0, 40)}
                    {client.nextStep.length > 40 ? "…" : ""}
                  </span>
                )}
                <span className="mt-0.5 block">
                  Última actividad:{" "}
                  {client.lastActivityAt
                    ? formatDate(client.lastActivityAt)
                    : "Sin actividad"}
                </span>
              </div>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Acciones de ${client.name}`}
                      >
                        <HugeiconsIcon
                          icon={MoreHorizontalCircle01Icon}
                          strokeWidth={2}
                        />
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
            </div>
          </Card>
        ))}
      </div>

      {clientList.length === 0 && !isLoading && (
        <div className="empty-state py-12">
          No se encontraron clientes con los filtros seleccionados
        </div>
      )}

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
            <p className="text-xs text-red-600">
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
    return (
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) setShowModal(false)
        }}
      >
        <DialogContent className="max-h-[92vh] w-[min(calc(100vw-2rem),1120px)] max-w-none overflow-y-auto sm:max-w-none sm:p-7">
          <DialogHeader>
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

          <form
            ref={formRef}
            onSubmit={submitClient}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <FormErrorSummary error={saveError} className="md:col-span-2" />

            {/* name - span 2 */}
            <div className="md:col-span-2">
              <Input
                required
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Nombre de la cuenta"
                {...fieldErrorProps("name", fieldErrors.name)}
              />
              <FieldError name="name" message={fieldErrors.name} />
            </div>

            {/* domain | type */}
            <div>
              <Input
                value={form.domain}
                onChange={(e) => updateForm("domain", e.target.value)}
                placeholder="Dominio web. Ej: empresa.com"
                {...fieldErrorProps("domain", fieldErrors.domain)}
              />
              <FieldError name="domain" message={fieldErrors.domain} />
            </div>
            <div>
              <Select
                value={form.type}
                onValueChange={(v) => updateForm("type", v as ClientType)}
              >
                <SelectTrigger {...fieldErrorProps("type", fieldErrors.type)}>
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

            {/* person | seller */}
            <div>
              <Select
                value={form.person}
                onValueChange={(v) => updateForm("person", v as PersonType)}
              >
                <SelectTrigger
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
            {canChooseSeller ? (
              <div>
                <Select
                  value={form.sellerId}
                  onValueChange={(v) => updateForm("sellerId", v)}
                >
                  <SelectTrigger
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
                <FieldError name="sellerId" message={fieldErrors.sellerId} />
              </div>
            ) : (
              <div className="hidden md:block" />
            )}

            {/* source | provider */}
            <div>
              <Select
                value={form.source}
                onValueChange={(v) => updateForm("source", v as ClientSource)}
              >
                <SelectTrigger
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
              <Input
                value={form.provider}
                onChange={(e) => updateForm("provider", e.target.value)}
                placeholder="Proveedor actual"
                {...fieldErrorProps("provider", fieldErrors.provider)}
              />
              <FieldError name="provider" message={fieldErrors.provider} />
            </div>

            {/* units | amount */}
            <div>
              <Input
                type="number"
                min="0"
                value={form.units || ""}
                onChange={(e) => updateForm("units", Number(e.target.value))}
                placeholder="Unidades potenciales"
                {...fieldErrorProps("units", fieldErrors.units)}
              />
              <FieldError name="units" message={fieldErrors.units} />
            </div>
            <div>
              <Input
                type="number"
                min="0"
                value={form.expectedAmount || ""}
                onChange={(e) =>
                  updateForm("expectedAmount", Number(e.target.value))
                }
                placeholder="Monto esperado"
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

            {/* stage - col 1 only */}
            <div>
              <Select
                value={form.stage}
                onValueChange={(v) => updateForm("stage", v as PipelineStage)}
              >
                <SelectTrigger {...fieldErrorProps("stage", fieldErrors.stage)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="stage" message={fieldErrors.stage} />
            </div>
            <div className="hidden md:block" />

            {/* Contacts - span 2 */}
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="slabel">Contactos</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() =>
                    updateForm("contacts", [
                      ...(form.contacts ?? []),
                      { ...emptyContact },
                    ])
                  }
                  className="h-auto p-0 text-[11px] text-[#00A8E8]"
                >
                  + Agregar contacto
                </Button>
              </div>
              <div className="space-y-2">
                {(form.contacts ?? []).map((contact, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.15fr)_auto] xl:items-center"
                  >
                    <Input
                      className="min-w-0"
                      value={contact.name}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], name: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Nombre contacto"
                    />
                    <Input
                      className="min-w-0"
                      value={contact.role}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], role: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Rol: decisor, finanzas..."
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
                    />
                    <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:min-w-[120px]">
                      <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold whitespace-nowrap text-slate-600">
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
                      </label>
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
                          className="h-auto p-0 text-[11px] text-red-600 hover:text-red-800"
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain - span 2 */}
            <div className="md:col-span-2">
              <Textarea
                value={form.pain}
                onChange={(e) => updateForm("pain", e.target.value)}
                placeholder="¿Por qué crees que Tracker puede ayudarle? Dolor / necesidad detectada"
                rows={4}
                className="resize-none"
                {...fieldErrorProps("pain", fieldErrors.pain)}
              />
              <FieldError name="pain" message={fieldErrors.pain} />
            </div>

            {/* AI Coach hint - span 2 */}
            <div className="ai-box md:col-span-2">
              <strong>Coach IA:</strong> Un buen registro debe identificar
              empresa, contactos clave, decisor, teléfono, correo/dominio y
              razón comercial.
            </div>

            {/* Save button - span 2 */}
            <Button
              type="submit"
              disabled={createClient.isPending || updateClient.isPending}
              className="justify-center md:col-span-2"
              size="lg"
            >
              {createClient.isPending || updateClient.isPending
                ? "Guardando..."
                : editingClient
                  ? "Guardar cambios"
                  : "Guardar cliente"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
}
