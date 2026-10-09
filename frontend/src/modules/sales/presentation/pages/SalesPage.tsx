import { useState, type FormEvent } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  BarChartIcon,
  ChecklistIcon,
  DollarIcon,
  MoreHorizontalIcon,
  PlusIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import { formatCurrency } from "@/shared/lib/format"
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { StatCard } from "@/shared/components/data/StatCard"
import { StatusBadge } from "@/shared/components/data/StatusBadge"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { DataTable } from "@/shared/components/data/DataTable"
import { useAppStore } from "@/shared/store/app.store"
import { useSellers } from "@/modules/equipo/application/hooks/useSellers"
import { useCreateSale } from "../../application/hooks/useCreateSale"
import { useSales } from "../../application/hooks/useSales"
import { useDeleteSale } from "../../application/hooks/useDeleteSale"
import type {
  CreateSaleInput,
  PaymentMethod,
  SaleSource,
  Sale,
} from "../../domain/sales.types"
import { UserRole } from "@/core/domain/types/common.types"
import { useApiFormErrors } from "@/shared/lib/api-errors"
import { FormErrorSummary } from "@/shared/components/forms/FormErrorSummary"
import { FieldError } from "@/shared/components/forms/FieldError"
import { fieldErrorProps } from "@/shared/components/forms/field-error-props"
import { ClientCombobox } from "@/shared/components/forms/ClientCombobox"
import { DatePickerField } from "@/shared/components/forms/DatePickerField"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditSaleModal } from "../components/EditSaleModal"
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

const PAYMENT_METHODS: PaymentMethod[] = [
  "Pagado",
  "Crédito",
  "50% anticipo",
  "Pendiente",
]
const DIRECTION_SELLER_NAME: SaleSource = "Dirección Comercial"
const SALE_SOURCES: SaleSource[] = [
  "Prospección propia",
  "Cliente existente",
  "Referido",
  "Expo",
  "Marketing",
  "LinkedIn",
  "Web",
  DIRECTION_SELLER_NAME,
]

function today() {
  return new Date().toISOString().split("T")[0]
}

export function SalesPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const sellerId = currentUser?.sellerId ?? ""
  const isAdminOrDirector =
    currentUser?.role === UserRole.Admin ||
    currentUser?.role === UserRole.Director

  // Seller lookup for Admin/Director forms (hook is self-gated to Admin/Director)
  const { data: sellersData } = useSellers()
  const directionSellerId =
    sellersData?.find(
      (seller) => seller.active && seller.name === DIRECTION_SELLER_NAME
    )?.id ?? ""

  // Seller form state
  const [sellerClientId, setSellerClientId] = useState("")
  const [sellerClientName, setSellerClientName] = useState("")
  const [sellerClientType, setSellerClientType] = useState<
    "Nuevo" | "Existente"
  >("Existente")
  const [sellerProduct, setSellerProduct] = useState("")
  const [sellerUnits, setSellerUnits] = useState<number | "">("")
  const [sellerAmount, setSellerAmount] = useState<number | "">("")
  const [sellerDate, setSellerDate] = useState(today())
  const [sellerPay, setSellerPay] = useState<PaymentMethod>("Pagado")
  const [sellerSource, setSellerSource] =
    useState<SaleSource>("Cliente existente")
  const [sellerNotes, setSellerNotes] = useState("")

  // Direction form state
  const [dirProject, setDirProject] = useState("")
  const [dirUnits, setDirUnits] = useState<number | "">("")
  const [dirAmount, setDirAmount] = useState<number | "">("")
  const [dirDate, setDirDate] = useState(today())
  const [dirNotes, setDirNotes] = useState("")

  // ATC form state
  const [atcUnits, setAtcUnits] = useState<number | "">("")
  const [atcAmount, setAtcAmount] = useState<number | "">("")
  const [atcDate, setAtcDate] = useState(today())
  const [atcNotes, setAtcNotes] = useState("")

  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null)

  const createSellerSale = useCreateSale()
  const createDirSale = useCreateSale()
  const createAtcSale = useCreateSale()
  const { mutate: deleteSale } = useDeleteSale()

  const { formRef: sellerFormRef, ...sellerErrors } = useApiFormErrors(
    createSellerSale.error
  )
  const { formRef: dirFormRef, ...dirErrors } = useApiFormErrors(
    createDirSale.error
  )
  const { formRef: atcFormRef, ...atcErrors } = useApiFormErrors(
    createAtcSale.error
  )

  const {
    data,
    isLoading: loadingList,
    isError,
  } = useSales(!isAdminOrDirector ? { sellerId } : {})

  function handleSellerSubmit(e: FormEvent) {
    e.preventDefault()
    const input: CreateSaleInput = {
      sellerId,
      clientId: sellerClientId,
      clientName: sellerClientName,
      clientType: sellerClientType,
      product: sellerProduct,
      units: Number(sellerUnits),
      amount: Number(sellerAmount),
      pay: sellerPay,
      source: sellerSource,
      date: sellerDate,
      notes: sellerNotes || undefined,
      type: "seller",
    }
    createSellerSale.mutate(input, {
      onSuccess: () => {
        toast.success("Venta registrada")
        setSellerClientId("")
        setSellerClientName("")
        setSellerClientType("Existente")
        setSellerProduct("")
        setSellerUnits("")
        setSellerAmount("")
        setSellerDate(today())
        setSellerNotes("")
      },
      onError: () => toast.error("No se pudo registrar la venta"),
    })
  }

  function handleDirSubmit(e: FormEvent) {
    e.preventDefault()
    if (!directionSellerId) {
      toast.error(
        `${DIRECTION_SELLER_NAME} aún no está disponible. Espera un momento e inténtalo de nuevo.`
      )
      return
    }
    const input: CreateSaleInput = {
      sellerId: directionSellerId,
      clientId: undefined,
      clientName: dirProject,
      clientType: "Existente",
      product: dirProject,
      units: Number(dirUnits),
      amount: Number(dirAmount),
      pay: "Pagado",
      source: DIRECTION_SELLER_NAME,
      date: dirDate,
      notes: dirNotes || undefined,
      type: "direction",
    }
    createDirSale.mutate(input, {
      onSuccess: () => {
        toast.success("Venta registrada")
        setDirProject("")
        setDirUnits("")
        setDirAmount("")
        setDirDate(today())
        setDirNotes("")
      },
      onError: () => toast.error("No se pudo registrar la venta"),
    })
  }

  function handleAtcSubmit(e: FormEvent) {
    e.preventDefault()
    if (!directionSellerId) {
      toast.error(
        `${DIRECTION_SELLER_NAME} aún no está disponible. Espera un momento e inténtalo de nuevo.`
      )
      return
    }
    const input: CreateSaleInput = {
      sellerId: directionSellerId,
      clientId: undefined,
      clientName: "ATC",
      clientType: "Existente",
      product: "ATC",
      units: Number(atcUnits),
      amount: Number(atcAmount),
      pay: "Pagado",
      source: "Cliente existente",
      date: atcDate,
      notes: atcNotes || undefined,
      type: "atc",
    }
    createAtcSale.mutate(input, {
      onSuccess: () => {
        toast.success("Venta registrada")
        setAtcUnits("")
        setAtcAmount("")
        setAtcDate(today())
        setAtcNotes("")
      },
      onError: () => toast.error("No se pudo registrar la venta"),
    })
  }

  const summary = data?.summary

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="max-w-56 min-w-40">
          <p className="truncate font-medium text-foreground">
            {row.original.clientName}
          </p>
          <p className="truncate text-muted-foreground">
            {row.original.product}
            <span className="md:hidden">
              {" "}
              · {row.original.units} ud. · {row.original.date}
            </span>
          </p>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Fecha",
      // Below md, date and units move into the Cliente cell so Monto and the
      // actions menu fit at 390px without scrolling the table.
      meta: { className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          {row.original.date}
        </span>
      ),
    },
    {
      accessorKey: "units",
      header: "Unidades",
      meta: { className: "hidden text-right md:table-cell" },
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.units} ud.</span>
      ),
    },
    {
      id: "kind",
      header: "Tipo",
      meta: { className: "hidden lg:table-cell" },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={row.original.clientType} />
          <Badge variant="outline">{row.original.type}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "pay",
      header: "Pago",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => <StatusBadge status={row.original.pay} />,
    },
    {
      accessorKey: "amount",
      header: "Monto",
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-foreground tabular-nums">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    ...(isAdminOrDirector
      ? [
          {
            id: "actions",
            header: () => <span className="sr-only">Acciones</span>,
            meta: { className: "w-12 text-right" },
            cell: ({ row }) => {
              const sale = row.original
              return (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Acciones de venta ${sale.clientName}`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Acciones de venta</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem onSelect={() => setEditingSale(sale)}>
                      Editar venta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeletingSale(sale)}
                    >
                      Eliminar venta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            },
          } satisfies ColumnDef<Sale>,
        ]
      : []),
  ]

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Registro de cierres por tipo"
        actions={
          <Button
            onClick={() =>
              document
                .getElementById(
                  isAdminOrDirector ? "sale-dir-project" : "sale-client"
                )
                ?.focus()
            }
          >
            <PlusIcon />
            Registrar venta
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        {/* Formulario vendedor — solo Seller */}
        {!isAdminOrDirector && (
          <form
            ref={sellerFormRef}
            onSubmit={handleSellerSubmit}
            className="col-span-12 bg-background"
          >
            <div className="border-b p-4 md:p-6">
              <h2 className="text-base font-semibold">
                Registrar venta del día
              </h2>
            </div>

            {sellerErrors.summary && (
              <div className="p-4 pb-0 md:px-6">
                <FormErrorSummary error={sellerErrors.summary} />
              </div>
            )}

            <div className="grid gap-px bg-border xl:grid-cols-2">
              <section className="bg-background p-4 md:p-6">
                <h5 className="text-base font-semibold">Venta</h5>
                <div className="mt-6 flex flex-col gap-6">
                  <div>
                    <Label htmlFor="sale-client">Cliente</Label>
                    <div className="mt-2">
                      <ClientCombobox
                        id="sale-client"
                        value={sellerClientId}
                        onSelect={(client) => {
                          setSellerClientId(client?.id ?? "")
                          setSellerClientName(client?.name ?? "")
                          setSellerClientType(
                            client?.type === "Nuevo" ? "Nuevo" : "Existente"
                          )
                          sellerErrors.clearField("clientId")
                        }}
                        placeholder="Seleccionar cliente"
                        error={!!sellerErrors.fieldErrors.clientId}
                      />
                    </div>
                    <FieldError
                      name="clientId"
                      message={sellerErrors.fieldErrors.clientId}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sale-product">Producto</Label>
                    <Input
                      id="sale-product"
                      type="text"
                      className="mt-2"
                      value={sellerProduct}
                      onChange={(e) => {
                        setSellerProduct(e.target.value)
                        sellerErrors.clearField("product")
                      }}
                      placeholder="Nombre del producto"
                      required
                      {...fieldErrorProps(
                        "product",
                        sellerErrors.fieldErrors.product
                      )}
                    />
                    <FieldError
                      name="product"
                      message={sellerErrors.fieldErrors.product}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sale-units">Unidades</Label>
                      <Input
                        id="sale-units"
                        type="number"
                        min="1"
                        className="mt-2"
                        value={sellerUnits}
                        onChange={(e) => {
                          setSellerUnits(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          sellerErrors.clearField("units")
                        }}
                        required
                        {...fieldErrorProps(
                          "units",
                          sellerErrors.fieldErrors.units
                        )}
                      />
                      <FieldError
                        name="units"
                        message={sellerErrors.fieldErrors.units}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale-amount">Monto factura</Label>
                      <Input
                        id="sale-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-2"
                        value={sellerAmount}
                        onChange={(e) => {
                          setSellerAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          sellerErrors.clearField("amount")
                        }}
                        required
                        {...fieldErrorProps(
                          "amount",
                          sellerErrors.fieldErrors.amount
                        )}
                      />
                      <FieldError
                        name="amount"
                        message={sellerErrors.fieldErrors.amount}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-background p-4 md:p-6">
                <h5 className="text-base font-semibold">Pago y origen</h5>
                <div className="mt-6 flex flex-col gap-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label>Fecha</Label>
                      <div className="mt-2">
                        <DatePickerField
                          value={sellerDate}
                          onChange={(v) => {
                            setSellerDate(v)
                            sellerErrors.clearField("date")
                          }}
                          {...fieldErrorProps(
                            "date",
                            sellerErrors.fieldErrors.date
                          )}
                        />
                      </div>
                      <FieldError
                        name="date"
                        message={sellerErrors.fieldErrors.date}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale-pay">Forma de pago</Label>
                      <Select
                        value={sellerPay}
                        onValueChange={(v) => {
                          setSellerPay(v as PaymentMethod)
                          sellerErrors.clearField("pay")
                        }}
                      >
                        <SelectTrigger
                          id="sale-pay"
                          className="mt-2 w-full"
                          {...fieldErrorProps(
                            "pay",
                            sellerErrors.fieldErrors.pay
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError
                        name="pay"
                        message={sellerErrors.fieldErrors.pay}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sale-source">Fuente</Label>
                    <Select
                      value={sellerSource}
                      onValueChange={(v) => {
                        setSellerSource(v as SaleSource)
                        sellerErrors.clearField("source")
                      }}
                    >
                      <SelectTrigger
                        id="sale-source"
                        className="mt-2 w-full"
                        {...fieldErrorProps(
                          "source",
                          sellerErrors.fieldErrors.source
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALE_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      name="source"
                      message={sellerErrors.fieldErrors.source}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sale-notes">Notas de venta</Label>
                    <Textarea
                      id="sale-notes"
                      rows={2}
                      className="mt-2"
                      value={sellerNotes}
                      onChange={(e) => {
                        setSellerNotes(e.target.value)
                        sellerErrors.clearField("notes")
                      }}
                      placeholder="Observaciones adicionales"
                      {...fieldErrorProps(
                        "notes",
                        sellerErrors.fieldErrors.notes
                      )}
                    />
                    <FieldError
                      name="notes"
                      message={sellerErrors.fieldErrors.notes}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-end border-t p-4 md:px-6">
              <Button
                type="submit"
                size="lg"
                disabled={createSellerSale.isPending}
              >
                {createSellerSale.isPending
                  ? "Guardando..."
                  : "Guardar venta vendedor"}
              </Button>
            </div>
          </form>
        )}

        {/* Dirección + ATC — solo Admin/Director */}
        {isAdminOrDirector && (
          <div className="col-span-12 grid gap-px bg-border xl:grid-cols-2">
            <form
              ref={dirFormRef}
              onSubmit={handleDirSubmit}
              className="flex flex-col bg-background"
            >
              <section className="flex-1 p-4 md:p-6">
                <h2 className="text-base font-semibold">Ventas Dirección</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cuentas cerradas directamente por Dirección Comercial
                </p>
                <div className="mt-6 flex flex-col gap-6">
                  <FormErrorSummary error={dirErrors.summary} />

                  <div>
                    <Label>Fecha</Label>
                    <div className="mt-2">
                      <DatePickerField
                        value={dirDate}
                        onChange={(v) => {
                          setDirDate(v)
                          dirErrors.clearField("date")
                        }}
                        {...fieldErrorProps("date", dirErrors.fieldErrors.date)}
                      />
                    </div>
                    <FieldError
                      name="date"
                      message={dirErrors.fieldErrors.date}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sale-dir-project">Cuenta / Proyecto</Label>
                    <Input
                      id="sale-dir-project"
                      type="text"
                      className="mt-2"
                      value={dirProject}
                      onChange={(e) => {
                        setDirProject(e.target.value)
                        dirErrors.clearField("product")
                        dirErrors.clearField("clientName")
                      }}
                      placeholder="Nombre de la cuenta o proyecto"
                      required
                      {...fieldErrorProps(
                        "product",
                        dirErrors.fieldErrors.product ??
                          dirErrors.fieldErrors.clientName
                      )}
                    />
                    <FieldError
                      name="product"
                      message={
                        dirErrors.fieldErrors.product ??
                        dirErrors.fieldErrors.clientName
                      }
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sale-dir-units">Unidades Dirección</Label>
                      <Input
                        id="sale-dir-units"
                        type="number"
                        min="1"
                        className="mt-2"
                        value={dirUnits}
                        onChange={(e) => {
                          setDirUnits(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          dirErrors.clearField("units")
                        }}
                        required
                        {...fieldErrorProps(
                          "units",
                          dirErrors.fieldErrors.units
                        )}
                      />
                      <FieldError
                        name="units"
                        message={dirErrors.fieldErrors.units}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale-dir-amount">Monto Dirección</Label>
                      <Input
                        id="sale-dir-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-2"
                        value={dirAmount}
                        onChange={(e) => {
                          setDirAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          dirErrors.clearField("amount")
                        }}
                        required
                        {...fieldErrorProps(
                          "amount",
                          dirErrors.fieldErrors.amount
                        )}
                      />
                      <FieldError
                        name="amount"
                        message={dirErrors.fieldErrors.amount}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sale-dir-notes">Notas Dirección</Label>
                    <Textarea
                      id="sale-dir-notes"
                      rows={2}
                      className="mt-2"
                      value={dirNotes}
                      onChange={(e) => {
                        setDirNotes(e.target.value)
                        dirErrors.clearField("notes")
                      }}
                      placeholder="Observaciones adicionales"
                      {...fieldErrorProps("notes", dirErrors.fieldErrors.notes)}
                    />
                    <FieldError
                      name="notes"
                      message={dirErrors.fieldErrors.notes}
                    />
                  </div>
                </div>
              </section>
              <div className="flex justify-end border-t p-4 md:px-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createDirSale.isPending}
                >
                  {createDirSale.isPending
                    ? "Guardando..."
                    : "Guardar Venta Dirección"}
                </Button>
              </div>
            </form>

            <form
              ref={atcFormRef}
              onSubmit={handleAtcSubmit}
              className="flex flex-col bg-background"
            >
              <section className="flex-1 p-4 md:p-6">
                <h2 className="text-base font-semibold">Registrar ATC</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  ATC solo registra clientes existentes
                </p>
                <div className="mt-6 flex flex-col gap-6">
                  <FormErrorSummary error={atcErrors.summary} />

                  <div>
                    <Label>Fecha</Label>
                    <div className="mt-2">
                      <DatePickerField
                        value={atcDate}
                        onChange={(v) => {
                          setAtcDate(v)
                          atcErrors.clearField("date")
                        }}
                        {...fieldErrorProps("date", atcErrors.fieldErrors.date)}
                      />
                    </div>
                    <FieldError
                      name="date"
                      message={atcErrors.fieldErrors.date}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sale-atc-units">Unidades ATC</Label>
                      <Input
                        id="sale-atc-units"
                        type="number"
                        min="1"
                        className="mt-2"
                        value={atcUnits}
                        onChange={(e) => {
                          setAtcUnits(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          atcErrors.clearField("units")
                        }}
                        required
                        {...fieldErrorProps(
                          "units",
                          atcErrors.fieldErrors.units
                        )}
                      />
                      <FieldError
                        name="units"
                        message={atcErrors.fieldErrors.units}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale-atc-amount">Monto pagado ATC</Label>
                      <Input
                        id="sale-atc-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-2"
                        value={atcAmount}
                        onChange={(e) => {
                          setAtcAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                          atcErrors.clearField("amount")
                        }}
                        required
                        {...fieldErrorProps(
                          "amount",
                          atcErrors.fieldErrors.amount
                        )}
                      />
                      <FieldError
                        name="amount"
                        message={atcErrors.fieldErrors.amount}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sale-atc-notes">Notas ATC</Label>
                    <Textarea
                      id="sale-atc-notes"
                      rows={2}
                      className="mt-2"
                      value={atcNotes}
                      onChange={(e) => {
                        setAtcNotes(e.target.value)
                        atcErrors.clearField("notes")
                      }}
                      placeholder="Observaciones adicionales"
                      {...fieldErrorProps("notes", atcErrors.fieldErrors.notes)}
                    />
                    <FieldError
                      name="notes"
                      message={atcErrors.fieldErrors.notes}
                    />
                  </div>
                </div>
              </section>
              <div className="flex justify-end border-t p-4 md:px-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createAtcSale.isPending}
                >
                  {createAtcSale.isPending ? "Guardando..." : "Guardar ATC"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Ventas registradas */}
        {summary && (
          <>
            <StatCard
              className="col-span-12 sm:col-span-6 xl:col-span-3"
              label="Total ventas"
              value={summary.total}
              icon={<BarChartIcon size={16} />}
            />
            <StatCard
              className="col-span-12 sm:col-span-6 xl:col-span-3"
              label="Unidades"
              value={summary.totalUnits}
              icon={<ChecklistIcon size={16} />}
            />
            <StatCard
              className="col-span-12 sm:col-span-6 xl:col-span-3"
              label="Monto total"
              value={formatCurrency(summary.totalAmount)}
              icon={<DollarIcon size={16} />}
            />
            <StatCard
              className="col-span-12 sm:col-span-6 xl:col-span-3"
              label="Nuevos / Existentes"
              value={`${summary.unitsByClientType.Nuevo} / ${summary.unitsByClientType.Existente}`}
              icon={<UsersIcon size={16} />}
              description="unidades"
            />
          </>
        )}

        <SectionCard
          title="Ventas registradas"
          icon={<DollarIcon size={16} />}
        >
          {loadingList && (
            <div
              role="status"
              aria-label="Cargando ventas"
              className="flex flex-col gap-3 p-4"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="p-4 text-sm text-status-danger">
              No se pudo cargar el historial.
            </p>
          )}
          {!loadingList && !isError && data && data.data.length === 0 && (
            <EmptyState
              icon={<DollarIcon size={20} />}
              title="No hay ventas registradas."
            />
          )}
          {!loadingList && !isError && data && data.data.length > 0 && (
            <DataTable
              columns={columns}
              data={data.data}
              getRowId={(s) => s.id}
            />
          )}
        </SectionCard>
      </div>

      {editingSale && (
        <EditSaleModal
          sale={editingSale}
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
        />
      )}

      <AlertDialog
        open={!!deletingSale}
        onOpenChange={(open) => {
          if (!open) setDeletingSale(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar la venta de <strong>{deletingSale?.clientName}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault()
                if (deletingSale) {
                  deleteSale(deletingSale.id)
                  setDeletingSale(null)
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
