import { useRef, useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TeamIcon,
  UserIcon,
  UsersIcon,
} from "@/shared/components/Icon"
import { useAppStore } from "../../../../shared/store/app.store"
import { UserRole } from "../../../../core/domain/types/common.types"
import { useUsers } from "../../application/hooks/useUsers"
import { useSellers } from "../../application/hooks/useSellers"
import { useBlockUser } from "../../application/hooks/useBlockUser"
import { useCreateSeller } from "../../application/hooks/useCreateSeller"
import { useCreateUser } from "../../application/hooks/useCreateUser"
import { useDeactivateSeller } from "../../application/hooks/useDeactivateSeller"
import type { EquipoSeller, EquipoUser } from "../../domain/equipo.types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { PageHeader } from "@/shared/components/layout/PageHeader"
import { SectionCard } from "@/shared/components/layout/SectionCard"
import { DottedDivider } from "@/shared/components/layout/DottedDivider"
import { DataTable } from "@/shared/components/data/DataTable"
import { EmptyState } from "@/shared/components/data/EmptyState"
import { StatusBadge } from "@/shared/components/data/StatusBadge"

// Same labels as the user menu (components/nav-user.tsx), which does not export them.
const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Director: "Director",
  Seller: "Vendedor",
}

function ListSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

type EquipoConfirmAction =
  | { kind: "user"; target: EquipoUser }
  | { kind: "seller"; target: EquipoSeller }

export function EquipoPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: usersError,
  } = useUsers()
  const { data: sellers, isLoading: loadingSellers } = useSellers()
  const blockUser = useBlockUser()
  const createSeller = useCreateSeller()
  const createUser = useCreateUser()
  const deactivateSeller = useDeactivateSeller()

  const [sellerName, setSellerName] = useState("")
  const [sellerProfile, setSellerProfile] = useState("")
  const [userUsername, setUserUsername] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState<string>("Seller")
  const [userSellerId, setUserSellerId] = useState<string>("")
  const [confirmAction, setConfirmAction] =
    useState<EquipoConfirmAction | null>(null)
  // The menu item that opens the dialog unmounts, so focus returns to the row trigger.
  const returnFocusId = useRef<string | null>(null)

  const isConfirmPending = blockUser.isPending || deactivateSeller.isPending
  const confirmLabel = confirmAction
    ? confirmAction.kind === "user"
      ? confirmAction.target.active
        ? "Bloquear usuario"
        : "Activar usuario"
      : confirmAction.target.active
        ? "Dar baja vendedor"
        : "Reactivar vendedor"
    : ""
  const confirmTargetName = confirmAction
    ? confirmAction.kind === "user"
      ? confirmAction.target.name || confirmAction.target.username
      : confirmAction.target.name
    : ""
  const confirmVariant = confirmAction?.target.active
    ? "destructive"
    : "default"

  function handleConfirmAction() {
    if (!confirmAction || isConfirmPending) return

    if (confirmAction.kind === "user") {
      blockUser.mutate(confirmAction.target.id, {
        onSettled: () => setConfirmAction(null),
      })
      return
    }

    deactivateSeller.mutate(confirmAction.target.id, {
      onSettled: () => setConfirmAction(null),
    })
  }

  if (currentUser?.role === UserRole.Seller) {
    return (
      <div>
        <PageHeader title="Equipo" />
        <div className="border border-border bg-background">
          <EmptyState
            icon={<AlertCircleIcon size={20} />}
            title="Acceso denegado"
          />
        </div>
      </div>
    )
  }

  function handleCreateSeller(e: FormEvent) {
    e.preventDefault()
    createSeller.mutate(
      { name: sellerName, profile: sellerProfile || undefined },
      {
        onSuccess: () => {
          setSellerName("")
          setSellerProfile("")
          toast.success("Vendedor creado")
        },
        onError: () => toast.error("No se pudo crear el vendedor"),
      }
    )
  }

  function handleCreateUser(e: FormEvent) {
    e.preventDefault()
    createUser.mutate(
      {
        username: userUsername,
        password: userPassword,
        name: userName || userUsername,
        role: userRole,
        sellerId: userRole === "Seller" ? userSellerId : undefined,
      },
      {
        onSuccess: () => {
          setUserUsername("")
          setUserPassword("")
          setUserName("")
          setUserRole("Seller")
          setUserSellerId("")
          toast.success("Usuario creado")
        },
        onError: () => toast.error("No se pudo crear el usuario"),
      }
    )
  }

  const sellerColumns: ColumnDef<EquipoSeller>[] = [
    {
      accessorKey: "name",
      header: "Vendedor",
      cell: ({ row }) => (
        <div className="whitespace-normal">
          <p className="font-medium text-foreground">{row.original.name}</p>
          <p className="text-muted-foreground sm:hidden">
            {row.original.profile || "Sin perfil"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "profile",
      header: "Perfil",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.profile || "Sin perfil"}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.active ? (
          <StatusBadge tone="success">Activo</StatusBadge>
        ) : (
          <StatusBadge tone="danger">De baja</StatusBadge>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Acciones</span>,
      meta: { className: "w-12 text-right" },
      cell: ({ row }) => {
        const seller = row.original
        return (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    id={`seller-actions-${seller.id}`}
                    disabled={deactivateSeller.isPending}
                    aria-label={`Acciones de vendedor ${seller.name}`}
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Acciones de vendedor</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                variant={seller.active ? "destructive" : "default"}
                onSelect={() => {
                  returnFocusId.current = `seller-actions-${seller.id}`
                  setConfirmAction({ kind: "seller", target: seller })
                }}
              >
                {seller.active ? "Dar baja vendedor" : "Reactivar vendedor"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Comerciales, accesos y usuarios del sistema"
      />

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <SectionCard
          title="Alta comercial"
          icon={<UserIcon size={16} />}
          className="lg:col-span-4"
        >
          <form onSubmit={handleCreateSeller} className="flex h-full flex-col">
            <div className="flex flex-1 flex-col gap-6 p-4">
              <div>
                <Label htmlFor="seller-name">Nombre</Label>
                <Input
                  id="seller-name"
                  className="mt-2"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="seller-profile">Perfil / foco comercial</Label>
                <Input
                  id="seller-profile"
                  className="mt-2"
                  value={sellerProfile}
                  onChange={(e) => setSellerProfile(e.target.value)}
                  placeholder="Perfil / foco comercial"
                />
              </div>
            </div>
            <div className="flex justify-end border-t p-4">
              <Button type="submit" size="lg" disabled={createSeller.isPending}>
                {createSeller.isPending ? "Guardando..." : "Guardar comercial"}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Crear usuario"
          icon={<PlusIcon size={16} />}
          className="lg:col-span-4"
        >
          <form onSubmit={handleCreateUser} className="flex h-full flex-col">
            <div className="flex flex-1 flex-col gap-6 p-4">
              <div>
                <Label htmlFor="user-username">Usuario</Label>
                <Input
                  id="user-username"
                  className="mt-2"
                  required
                  autoComplete="off"
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  placeholder="Usuario"
                />
              </div>
              <div>
                <Label htmlFor="user-password">Contraseña</Label>
                <Input
                  id="user-password"
                  className="mt-2"
                  required
                  type="password"
                  autoComplete="new-password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </div>
              <div>
                <Label htmlFor="user-full-name">Nombre completo</Label>
                <Input
                  id="user-full-name"
                  className="mt-2"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="user-role">Rol</Label>
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger id="user-role" className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Seller">Comercial</SelectItem>
                    <SelectItem value="Admin">Dirección / Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {userRole === "Seller" && (
                <div>
                  <Label htmlFor="user-seller">Vendedor</Label>
                  <Select value={userSellerId} onValueChange={setUserSellerId}>
                    <SelectTrigger id="user-seller" className="mt-2 w-full">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers
                        ?.filter((s) => s.active)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end border-t p-4">
              <Button type="submit" size="lg" disabled={createUser.isPending}>
                {createUser.isPending ? "Creando..." : "Crear acceso"}
              </Button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Usuarios del sistema"
          icon={<UsersIcon size={16} />}
          className="lg:col-span-4"
        >
          {loadingUsers ? (
            <ListSkeleton label="Cargando usuarios" />
          ) : usersData && usersData.data.length > 0 ? (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {usersData.data.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name || user.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.username} · {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {user.active ? (
                      <StatusBadge tone="success">Activo</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">Bloqueado</StatusBadge>
                    )}
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={
                                blockUser.isPending || user.username === "admin"
                              }
                              id={`user-actions-${user.id}`}
                              aria-label={`Acciones de usuario ${user.username}`}
                            >
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Acciones de usuario</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuItem
                          variant={user.active ? "destructive" : "default"}
                          onSelect={() => {
                            returnFocusId.current = `user-actions-${user.id}`
                            setConfirmAction({ kind: "user", target: user })
                          }}
                        >
                          {user.active ? "Bloquear usuario" : "Activar usuario"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<UsersIcon size={20} />}
              title={
                usersError
                  ? "Sin acceso a la lista de usuarios"
                  : "Sin usuarios registrados"
              }
            />
          )}
        </SectionCard>

        <DottedDivider />

        <SectionCard title="Equipo comercial" icon={<TeamIcon size={16} />}>
          {loadingSellers ? (
            <ListSkeleton label="Cargando vendedores" />
          ) : sellers && sellers.length > 0 ? (
            <DataTable
              columns={sellerColumns}
              data={sellers}
              getRowId={(s) => s.id}
            />
          ) : (
            <EmptyState
              icon={<TeamIcon size={20} />}
              title="Sin vendedores registrados"
            />
          )}
        </SectionCard>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !isConfirmPending) setConfirmAction(null)
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            const trigger =
              returnFocusId.current &&
              document.getElementById(returnFocusId.current)
            if (trigger) {
              e.preventDefault()
              trigger.focus()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que quieres {confirmLabel.toLowerCase()} a{" "}
              {confirmTargetName}. Esta acción actualizará el estado en Equipo
              Comercial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant={confirmVariant}
              disabled={isConfirmPending}
              onClick={handleConfirmAction}
            >
              {isConfirmPending ? "Procesando..." : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
