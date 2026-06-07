import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { UserRole } from "../../../../core/domain/types/common.types"
import { useAppStore } from "../../../../shared/store/app.store"
import { useAddContact } from "../../application/hooks/useAddContact"
import { useClients } from "../../application/hooks/useClients"
import { useCreateClient } from "../../application/hooks/useCreateClient"
import { useUpdateClient } from "../../application/hooks/useUpdateClient"
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

function compactMoney(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)
}

function cleanContact(contact: CreateContactInput): CreateContactInput {
  return {
    name: contact.name.trim(),
    role: contact.role?.trim() || undefined,
    phone: contact.phone?.trim() || undefined,
    email: contact.email?.trim() || undefined,
    isDecisionMaker: contact.isDecisionMaker,
  }
}

export function ClientesPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [q, setQ] = useState("")
  const [stage, setStage] = useState<PipelineStage | "">("")
  const [type, setType] = useState<ClientType | "">("")
  const [seller, setSeller] = useState("")
  const [form, setForm] = useState<CreateClientInput>(() =>
    emptyClientForm(currentUser?.sellerId)
  )
  const [edits, setEdits] = useState<Record<string, { stage: PipelineStage; nextStep: string }>>({})
  const [contactClientId, setContactClientId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState<CreateContactInput>(emptyContact)

  const filters = useMemo(
    () => ({
      q,
      stage: stage || undefined,
      type: type || undefined,
      seller: currentUser?.role === UserRole.Seller ? undefined : seller || undefined,
      limit: 50,
    }),
    [currentUser?.role, q, seller, stage, type]
  )

  const { data, isLoading, isError } = useClients(filters)
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const addContact = useAddContact()
  const canChooseSeller = currentUser?.role !== UserRole.Seller

  function updateForm<K extends keyof CreateClientInput>(key: K, value: CreateClientInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const firstContact = form.contacts?.[0]
    const contacts =
      firstContact?.name.trim() || firstContact?.phone?.trim() || firstContact?.email?.trim()
        ? [cleanContact(firstContact)]
        : []

    createClient.mutate(
      {
        ...form,
        domain: form.domain?.trim() || undefined,
        sellerId: canChooseSeller ? form.sellerId || undefined : currentUser?.sellerId ?? undefined,
        expectedAmount: Number(form.expectedAmount ?? 0),
        units: Number(form.units ?? 0),
        contacts,
      },
      {
        onSuccess: () => setForm(emptyClientForm(currentUser?.sellerId)),
      }
    )
  }

  function stageDraft(client: Client) {
    return edits[client.id] ?? { stage: client.stage, nextStep: client.nextStep ?? "" }
  }

  function saveClientPatch(client: Client) {
    const draft = stageDraft(client)
    updateClient.mutate({
      id: client.id,
      payload: {
        stage: draft.stage,
        nextStep: draft.nextStep,
      },
    })
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contactClientId) return

    addContact.mutate(
      { clientId: contactClientId, payload: cleanContact(contactForm) },
      {
        onSuccess: () => {
          setContactForm(emptyContact)
          setContactClientId(null)
        },
      }
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#002B49]">Clientes / Prospectos</h2>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.total} registros` : "Cartera comercial"}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[720px]">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar texto"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A8E8]"
          />
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as PipelineStage | "")}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos los stages</option>
            {pipelineStages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ClientType | "")}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos los tipos</option>
            {clientTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {canChooseSeller && (
            <input
              value={seller}
              onChange={(event) => setSeller(event.target.value)}
              placeholder="Seller ID"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#00A8E8]"
            />
          )}
        </div>
      </div>

      <form
        onSubmit={submitClient}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-4">
          <input
            required
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="Empresa"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.domain}
            onChange={(event) => updateForm("domain", event.target.value)}
            placeholder="Dominio"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(event) => updateForm("type", event.target.value as ClientType)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {clientTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={form.source}
            onChange={(event) => updateForm("source", event.target.value as ClientSource)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {clientSources.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {canChooseSeller && (
            <input
              required
              value={form.sellerId}
              onChange={(event) => updateForm("sellerId", event.target.value)}
              placeholder="Seller ID"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          )}
          <select
            value={form.person}
            onChange={(event) => updateForm("person", event.target.value as PersonType)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {personTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={form.expectedAmount}
            onChange={(event) => updateForm("expectedAmount", Number(event.target.value))}
            placeholder="Monto esperado"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            value={form.units}
            onChange={(event) => updateForm("units", Number(event.target.value))}
            placeholder="Unidades"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.nextStep}
            onChange={(event) => updateForm("nextStep", event.target.value)}
            placeholder="Siguiente paso"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={form.contacts?.[0]?.name ?? ""}
            onChange={(event) =>
              updateForm("contacts", [
                { ...(form.contacts?.[0] ?? emptyContact), name: event.target.value },
              ])
            }
            placeholder="Contacto"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.contacts?.[0]?.role ?? ""}
            onChange={(event) =>
              updateForm("contacts", [
                { ...(form.contacts?.[0] ?? emptyContact), role: event.target.value },
              ])
            }
            placeholder="Rol"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.contacts?.[0]?.phone ?? ""}
            onChange={(event) =>
              updateForm("contacts", [
                { ...(form.contacts?.[0] ?? emptyContact), phone: event.target.value },
              ])
            }
            placeholder="Telefono"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.contacts?.[0]?.email ?? ""}
            onChange={(event) =>
              updateForm("contacts", [
                { ...(form.contacts?.[0] ?? emptyContact), email: event.target.value },
              ])
            }
            placeholder="Email"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            disabled={createClient.isPending}
            className="rounded-md bg-[#002B49] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {createClient.isPending ? "Guardando..." : "Crear cliente"}
          </button>
        </div>
      </form>

      {createClient.isError && (
        <p className="text-sm text-red-600">
          {createClient.error instanceof Error ? createClient.error.message : "No se pudo crear"}
        </p>
      )}
      {isLoading && <p className="text-sm text-slate-400">Cargando clientes...</p>}
      {isError && <p className="text-sm text-red-600">No se pudo cargar la cartera.</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {data?.data.map((client) => {
          const draft = stageDraft(client)
          return (
            <article
              key={client.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#002B49]">{client.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {client.type}
                    </span>
                    <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700">
                      {client.stage}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {client.domain ?? "Sin dominio"} · Seller {client.sellerId.slice(0, 8)}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {compactMoney(client.expectedAmount)}
                  </p>
                  <p className="text-xs text-slate-400">{client.units} unidades</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <select
                  value={draft.stage}
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [client.id]: { ...draft, stage: event.target.value as PipelineStage },
                    }))
                  }
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  {pipelineStages.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  value={draft.nextStep}
                  onChange={(event) =>
                    setEdits((current) => ({
                      ...current,
                      [client.id]: { ...draft, nextStep: event.target.value },
                    }))
                  }
                  placeholder="Siguiente paso"
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => saveClientPatch(client)}
                  disabled={updateClient.isPending}
                  className="rounded-md border border-[#002B49] px-4 py-2 text-sm font-semibold text-[#002B49] disabled:opacity-50"
                >
                  Actualizar
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {client.contacts.length > 0 ? (
                  client.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-medium text-slate-700">{contact.name}</p>
                      <p className="text-xs text-slate-500">
                        {contact.role || "Sin rol"} · {contact.phone || "Sin telefono"} ·{" "}
                        {contact.email || "Sin email"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-400">
                    Sin contactos registrados
                  </p>
                )}
              </div>

              {contactClientId === client.id ? (
                <form onSubmit={submitContact} className="mt-4 grid gap-2 md:grid-cols-5">
                  <input
                    required
                    value={contactForm.name}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Nombre"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={contactForm.role}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, role: event.target.value }))
                    }
                    placeholder="Rol"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={contactForm.phone}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="Telefono"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    value={contactForm.email}
                    onChange={(event) =>
                      setContactForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="Email"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    disabled={addContact.isPending}
                    className="rounded-md bg-[#00A8E8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setContactClientId(client.id)}
                  className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  Agregar contacto
                </button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
