import { useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"
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

type EquipoConfirmAction =
  | { kind: "user"; target: EquipoUser }
  | { kind: "seller"; target: EquipoSeller }

export function EquipoPage() {
  const currentUser = useAppStore((s) => s.currentUser)
  const { data: usersData, isLoading: loadingUsers } = useUsers()
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
  const [confirmAction, setConfirmAction] = useState<EquipoConfirmAction | null>(null)

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
  const confirmVariant = confirmAction?.target.active ? "destructive" : "default"

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
      <div className="p-6">
        <p className="text-sm text-red-500">Acceso denegado</p>
      </div>
    )
  }

  function handleCreateSeller(e: FormEvent) {
    e.preventDefault()
    createSeller.mutate(
      { name: sellerName, profile: sellerProfile || undefined },
      {
        onSuccess: () => {
          setSellerName(""); setSellerProfile("")
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
          setUserUsername(""); setUserPassword(""); setUserName("")
          setUserRole("Seller"); setUserSellerId("")
          toast.success("Usuario creado")
        },
        onError: () => toast.error("No se pudo crear el usuario"),
      }
    )
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-black" style={{ color: "#002B49" }}>Equipo Comercial</h2>

      {/* Forms grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {/* Alta comercial */}
        <div className="card p-5">
          <div className="slabel mb-4">Alta comercial</div>
          <form onSubmit={handleCreateSeller} className="flex flex-col gap-3">
            <Input
              required
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Nombre"
            />
            <Input
              value={sellerProfile}
              onChange={(e) => setSellerProfile(e.target.value)}
              placeholder="Perfil / foco comercial"
            />
            <Button type="submit" disabled={createSeller.isPending} className="justify-center">
              {createSeller.isPending ? "Guardando..." : "Guardar comercial"}
            </Button>
          </form>
        </div>

        {/* Crear usuario */}
        <div className="card p-5">
          <div className="slabel mb-4">Crear usuario</div>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
            <Input
              required
              value={userUsername}
              onChange={(e) => setUserUsername(e.target.value)}
              placeholder="Usuario"
            />
            <Input
              required
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Contraseña"
            />
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nombre completo"
            />
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Seller">Comercial</SelectItem>
                <SelectItem value="Admin">Dirección / Admin</SelectItem>
              </SelectContent>
            </Select>
            {userRole === "Seller" && (
              <Select value={userSellerId} onValueChange={setUserSellerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {sellers?.filter(s => s.active).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button type="submit" disabled={createUser.isPending} variant="success" className="justify-center">
              {createUser.isPending ? "Creando..." : "Crear acceso"}
            </Button>
          </form>
        </div>

        {/* Usuarios del sistema */}
        <div className="card p-5">
          <div className="slabel mb-4">Usuarios del sistema</div>
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
            {loadingUsers ? (
              <p className="text-xs" style={{ color: "#94A3B8" }}>Cargando...</p>
            ) : (
              usersData?.data.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: "#F8FAFC", opacity: user.active ? 1 : 0.5 }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{user.name || user.username}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{user.username} · {user.role}</p>
                  </div>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={blockUser.isPending || user.username === "admin"}
                            aria-label={`Acciones de usuario ${user.username}`}
                          >
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Acciones de usuario</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem
                        variant={user.active ? "destructive" : "default"}
                        onSelect={() => setConfirmAction({ kind: "user", target: user })}
                      >
                        {user.active ? "Bloquear usuario" : "Activar usuario"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sellers table */}
      <div className="card p-5">
        <div className="slabel mb-4">Equipo comercial</div>
        {loadingSellers ? (
          <p className="text-xs" style={{ color: "#94A3B8" }}>Cargando...</p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {sellers?.map((seller) => (
              <div
                key={seller.id}
                className="seller-row flex items-center justify-between"
                style={{ opacity: seller.active ? 1 : 0.5 }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{seller.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8", marginTop: 2 }}>{seller.profile || "Sin perfil"}</p>
                </div>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={deactivateSeller.isPending}
                          aria-label={`Acciones de vendedor ${seller.name}`}
                        >
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Acciones de vendedor</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem
                      variant={seller.active ? "destructive" : "default"}
                      onSelect={() => setConfirmAction({ kind: "seller", target: seller })}
                    >
                      {seller.active ? "Dar baja vendedor" : "Reactivar vendedor"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !isConfirmPending) setConfirmAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que quieres {confirmLabel.toLowerCase()} a {confirmTargetName}.
              Esta acción actualizará el estado en Equipo Comercial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmPending}>Cancelar</AlertDialogCancel>
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
