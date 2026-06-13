import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { UserRole } from "@/core/domain/types/common.types"
import { useAppStore } from "@/shared/store/app.store"
import { activitiesApi } from "@/modules/activities/infrastructure/activities.api"
import type { Activity } from "@/modules/activities/domain/activities.types"
import { useClients } from "../../application/hooks/useClients"
import { useCreateClient } from "../../application/hooks/useCreateClient"
import { useDeleteClient } from "../../application/hooks/useDeleteClient"
import { useUpdateClient } from "../../application/hooks/useUpdateClient"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError, fieldErrorProps } from "@/shared/components/forms/FieldError"
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

const stageTag: Record<PipelineStage, string> = {
  Prospecto: "tag-gray",
  Contactado: "tag-navy",
  Interesado: "tag-navy",
  Propuesta: "tag-amber",
  Negociación: "tag-amber",
  Cierre: "tag-green",
  Perdido: "tag-red",
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
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
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
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<CreateClientInput>(() => emptyClientForm(currentUser?.sellerId))

  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const filters = useMemo(
    () => ({ q, limit: 50, cold: cold || undefined }),
    [q, cold]
  )

  const { data, isLoading, isError } = useClients(filters)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { summary: saveError, fieldErrors, clearField, formRef } = useApiFormErrors(
    createClient.error ?? updateClient.error
  )
  const { data: sellersData } = useSellers()
  const activeSellers = (sellersData ?? []).filter((s) => s.active)
  const canChooseSeller = currentUser?.role !== UserRole.Seller

  const clientList = data?.data ?? []
  const selectedClient = view.mode === "detail" ? clientList.find((c) => c.id === view.clientId) ?? null : null

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

  function updateForm<K extends keyof CreateClientInput>(key: K, value: CreateClientInput[K]) {
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
      sellerId: canChooseSeller ? form.sellerId || undefined : currentUser?.sellerId ?? undefined,
      expectedAmount: Number(form.expectedAmount ?? 0),
      units: Number(form.units ?? 0),
      contacts: (form.contacts ?? [])
        .filter((c) => c.name.trim() || c.phone?.trim() || c.email?.trim())
        .map(cleanContact),
    }

    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, payload },
        { onSuccess: () => setShowModal(false) }
      )
    } else {
      createClient.mutate(payload, {
        onSuccess: () => setShowModal(false),
      })
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        if (view.mode === "detail" && view.clientId === deleteTarget.id) {
          setView({ mode: "list" })
        }
      },
    })
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
      <div className="p-6 space-y-4">
        <button onClick={goToList} className="btn-ghost">
          ← Volver a clientes
        </button>

        <div className="grid gap-5" style={{ gridTemplateColumns: "280px 1fr" }}>
          {/* Left sidebar */}
          <div className="rounded-xl p-5 space-y-5" style={{ background: "#001524" }}>
            <div>
              <h2 className="text-lg font-bold text-white">{selectedClient.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`tag ${stageTag[selectedClient.stage]}`}>{selectedClient.stage}</span>
                <span className="text-[11px] text-slate-400">Seller {selectedClient.sellerId.slice(0, 8)}</span>
              </div>
            </div>

            <div>
              <p className="slabel text-slate-400">Contactos</p>
              <div className="mt-2 space-y-2">
                {selectedClient.contacts.length > 0 ? (
                  selectedClient.contacts.map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.role || "Sin rol"} {c.phone ? `· ${c.phone}` : ""}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Sin contactos</p>
                )}
              </div>
            </div>

            <div>
              <p className="slabel text-slate-400">Pain / Necesidad</p>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">{selectedClient.pain || "Sin registrarlo"}</p>
            </div>

            <div>
              <p className="slabel text-slate-400">Proveedor actual</p>
              <p className="mt-1 text-xs text-slate-300">{selectedClient.provider || "Sin info"}</p>
            </div>

            <div>
              <p className="slabel text-slate-400">Siguiente paso</p>
              <p className="mt-1 text-xs text-slate-300">{selectedClient.nextStep || "—"}</p>
              {selectedClient.nextDate && (
                <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(selectedClient.nextDate)}{selectedClient.nextTime ? ` ${selectedClient.nextTime}` : ""}</p>
              )}
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="slabel text-slate-400 mb-2">Registrar avance</p>
              <button
                onClick={() => openEdit(selectedClient)}
                className="w-full rounded-lg bg-[#82bc00] px-3 py-2 text-xs font-bold text-[#002B49] transition-colors hover:bg-[#6da000]"
              >
                Editar cliente
              </button>
            </div>
          </div>

          {/* Right content */}
          <div className="space-y-5">
            {/* Stage update */}
            <div className="card p-5">
              <p className="slabel mb-3">Actualizar stage</p>
              <div className="flex flex-wrap gap-2">
                {pipelineStages.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      updateClient.mutate({
                        id: selectedClient.id,
                        payload: { stage: s },
                      })
                    }
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                      selectedClient.stage === s
                        ? "bg-[#002B49] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity history */}
            <div className="card p-5">
              <p className="slabel mb-3">Historial de actividad ({clientActivities.length})</p>
              {clientActivities.length === 0 ? (
                <div className="empty-state">Sin actividades registradas para este cliente</div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {clientActivities.map((act) => (
                    <div key={act.id} className="log-card">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#002B49]">{act.type}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(act.executedAt)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{act.summary}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span>Resultado: <b className="text-slate-600">{act.result}</b></span>
                        <span>Calidad: <b className="text-slate-600">{act.quality}/5</b></span>
                        <span>Puntos: <b className="text-slate-600">{act.points}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit modal */}
        {showModal && editingClient && renderModal()}
      </div>
    )
  }

  // --- LIST VIEW ---
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#002B49]">Clientes / Prospectos</h2>
          <p className="mt-1 text-sm text-slate-500">{data ? `${data.total} registros` : "Cartera comercial"}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente..."
            className="input max-w-[360px]"
          />
          <button
            onClick={() => setCold((v) => !v)}
            className={cold ? "btn-primary whitespace-nowrap" : "btn-ghost whitespace-nowrap"}
          >
            Sin contacto
          </button>
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            + Nuevo cliente
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Cargando clientes...</p>}
      {isError && <p className="text-sm text-red-600">No se pudo cargar la cartera.</p>}

      {/* Client grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {clientList.map((client) => (
          <div key={client.id} className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => goToDetail(client.id)}
                  className="text-sm font-bold text-[#002B49] hover:underline text-left"
                >
                  {client.name}
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="tag tag-gray text-[9px]">{client.type}</span>
                <span className={`tag ${stageTag[client.stage]} text-[9px]`}>{client.stage}</span>
                {client.isCold && <span className="tag tag-red text-[9px]">Fría</span>}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{client.pain || "Sin pain registrado"}</p>
              {client.contacts.length > 0 && (
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  {client.contacts[0].name}
                  {client.contacts[0].phone ? ` · ${client.contacts[0].phone}` : ''}
                </p>
              )}
            </div>

            <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                <span>{activeSellers.find((s) => s.id === client.sellerId)?.name ?? client.sellerId.slice(0, 8)}</span>
                {client.nextDate && <span> · {formatDate(client.nextDate)}</span>}
                {client.nextStep && <span> · {client.nextStep.slice(0, 40)}{client.nextStep.length > 40 ? '…' : ''}</span>}
                <span className="block mt-0.5">
                  Última actividad: {client.lastActivityAt ? formatDate(client.lastActivityAt) : "Sin actividad"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(client)} className="btn-green">
                  Editar
                </button>
                <button onClick={() => setDeleteTarget(client)} className="btn-danger">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clientList.length === 0 && !isLoading && (
        <div className="empty-state py-12">No se encontraron clientes con los filtros seleccionados</div>
      )}

      {/* Create modal */}
      {showModal && renderModal()}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-blur">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#002B49]">Eliminar cliente</h3>
            <p className="text-xs text-slate-500">
              ¿Seguro que deseas eliminar <b>{deleteTarget.name}</b>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost">Cancelar</button>
              <button
                onClick={confirmDelete}
                disabled={deleteClient.isPending}
                className="btn-danger"
              >
                {deleteClient.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
            {deleteClient.isError && (
              <p className="text-xs text-red-600">
                {deleteClient.error instanceof Error ? deleteClient.error.message : "No se pudo eliminar"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // --- SHARED MODAL ---
  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center modal-blur overflow-y-auto py-8">
        <div className="card w-full max-w-[860px] p-7">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-base font-bold text-[#0F172A]">
              {editingClient ? "Editar cliente / prospecto" : "Nuevo cliente / prospecto"}
            </h3>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none bg-transparent border-none cursor-pointer"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-5">Puedes registrar varios contactos: decisor, finanzas, operaciones, compras, etc.</p>

          <form ref={formRef} onSubmit={submitClient} className="grid grid-cols-2 gap-3">
            <FormErrorSummary error={saveError} className="col-span-2" />

            {/* name - span 2 */}
            <div className="col-span-2">
              <input
                required
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Nombre de la cuenta"
                className={fieldErrors.name ? "input input-error" : "input"}
                {...fieldErrorProps("name", fieldErrors.name)}
              />
              <FieldError name="name" message={fieldErrors.name} />
            </div>

            {/* domain | type */}
            <div>
              <input
                value={form.domain}
                onChange={(e) => updateForm("domain", e.target.value)}
                placeholder="Dominio web. Ej: empresa.com"
                className={fieldErrors.domain ? "input input-error" : "input"}
                {...fieldErrorProps("domain", fieldErrors.domain)}
              />
              <FieldError name="domain" message={fieldErrors.domain} />
            </div>
            <div>
              <select
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value as ClientType)}
                className={fieldErrors.type ? "input input-error" : "input"}
                {...fieldErrorProps("type", fieldErrors.type)}
              >
                {clientTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <FieldError name="type" message={fieldErrors.type} />
            </div>

            {/* person | seller */}
            <div>
              <select
                value={form.person}
                onChange={(e) => updateForm("person", e.target.value as PersonType)}
                className={fieldErrors.person ? "input input-error" : "input"}
                {...fieldErrorProps("person", fieldErrors.person)}
              >
                {personTypes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <FieldError name="person" message={fieldErrors.person} />
            </div>
            {canChooseSeller ? (
              <div>
                <select
                  value={form.sellerId}
                  onChange={(e) => updateForm("sellerId", e.target.value)}
                  className={fieldErrors.sellerId ? "input input-error" : "input"}
                  {...fieldErrorProps("sellerId", fieldErrors.sellerId)}
                >
                  <option value="">Seleccionar vendedor</option>
                  {activeSellers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <FieldError name="sellerId" message={fieldErrors.sellerId} />
              </div>
            ) : <div />}

            {/* source | provider */}
            <div>
              <select
                value={form.source}
                onChange={(e) => updateForm("source", e.target.value as ClientSource)}
                className={fieldErrors.source ? "input input-error" : "input"}
                {...fieldErrorProps("source", fieldErrors.source)}
              >
                {clientSources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError name="source" message={fieldErrors.source} />
            </div>
            <div>
              <input
                value={form.provider}
                onChange={(e) => updateForm("provider", e.target.value)}
                placeholder="Proveedor actual"
                className={fieldErrors.provider ? "input input-error" : "input"}
                {...fieldErrorProps("provider", fieldErrors.provider)}
              />
              <FieldError name="provider" message={fieldErrors.provider} />
            </div>

            {/* units | amount */}
            <div>
              <input
                type="number"
                min="0"
                value={form.units}
                onChange={(e) => updateForm("units", Number(e.target.value))}
                placeholder="Unidades potenciales"
                className={fieldErrors.units ? "input input-error" : "input"}
                {...fieldErrorProps("units", fieldErrors.units)}
              />
              <FieldError name="units" message={fieldErrors.units} />
            </div>
            <div>
              <input
                type="number"
                min="0"
                value={form.expectedAmount}
                onChange={(e) => updateForm("expectedAmount", Number(e.target.value))}
                placeholder="Monto esperado"
                className={fieldErrors.expectedAmount ? "input input-error" : "input"}
                {...fieldErrorProps("expectedAmount", fieldErrors.expectedAmount)}
              />
              <FieldError name="expectedAmount" message={fieldErrors.expectedAmount} />
            </div>

            {/* stage - col 1 only */}
            <div>
              <select
                value={form.stage}
                onChange={(e) => updateForm("stage", e.target.value as PipelineStage)}
                className={fieldErrors.stage ? "input input-error" : "input"}
                {...fieldErrorProps("stage", fieldErrors.stage)}
              >
                {pipelineStages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError name="stage" message={fieldErrors.stage} />
            </div>
            <div />

            {/* Contacts - span 2 */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <p className="slabel">Contactos</p>
                <button
                  type="button"
                  onClick={() =>
                    updateForm("contacts", [...(form.contacts ?? []), { ...emptyContact }])
                  }
                  className="text-[11px] font-semibold text-[#00A8E8] hover:underline"
                >
                  + Agregar contacto
                </button>
              </div>
              <div className="space-y-2">
                {(form.contacts ?? []).map((contact, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                    <input
                      value={contact.name}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], name: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Nombre contacto"
                      className="input"
                    />
                    <input
                      value={contact.role}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], role: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Rol: decisor, finanzas..."
                      className="input"
                    />
                    <input
                      value={contact.phone}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], phone: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Teléfono"
                      className="input"
                    />
                    <input
                      value={contact.email}
                      onChange={(e) => {
                        const updated = [...(form.contacts ?? [])]
                        updated[idx] = { ...updated[idx], email: e.target.value }
                        updateForm("contacts", updated)
                      }}
                      placeholder="Correo"
                      className="input"
                    />
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contact.isDecisionMaker ?? false}
                          onChange={(e) => {
                            const updated = [...(form.contacts ?? [])]
                            updated[idx] = { ...updated[idx], isDecisionMaker: e.target.checked }
                            updateForm("contacts", updated)
                          }}
                        />
                        Decisor
                      </label>
                      {(form.contacts?.length ?? 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (form.contacts ?? []).filter((_, i) => i !== idx)
                            updateForm("contacts", updated)
                          }}
                          className="text-[11px] font-semibold text-red-600 hover:text-red-800 bg-none border-none cursor-pointer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain - span 2 */}
            <div className="col-span-2">
              <textarea
                value={form.pain}
                onChange={(e) => updateForm("pain", e.target.value)}
                placeholder="¿Por qué crees que Tracker puede ayudarle? Dolor / necesidad detectada"
                rows={4}
                className={`input resize-none${fieldErrors.pain ? " input-error" : ""}`}
                {...fieldErrorProps("pain", fieldErrors.pain)}
              />
              <FieldError name="pain" message={fieldErrors.pain} />
            </div>

            {/* AI Coach hint - span 2 */}
            <div className="ai-box col-span-2">
              <strong>Coach IA:</strong> Un buen registro debe identificar empresa, contactos clave, decisor, teléfono, correo/dominio y razón comercial.
            </div>

            {/* Save button - span 2 */}
            <button
              type="submit"
              disabled={createClient.isPending || updateClient.isPending}
              className="btn-primary col-span-2 justify-center py-2.5"
            >
              {createClient.isPending || updateClient.isPending
                ? "Guardando..."
                : editingClient
                  ? "Guardar cambios"
                  : "Guardar cliente"}
            </button>

          </form>
        </div>
      </div>
    )
  }
}
