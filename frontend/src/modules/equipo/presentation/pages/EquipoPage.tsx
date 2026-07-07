import { useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"
import { useAppStore } from "../../../../shared/store/app.store"
import { UserRole } from "../../../../core/domain/types/common.types"
import { useUsers } from "../../application/hooks/useUsers"
import { useSellers } from "../../application/hooks/useSellers"
import { useBlockUser } from "../../application/hooks/useBlockUser"
import { useCreateSeller } from "../../application/hooks/useCreateSeller"
import { useCreateUser } from "../../application/hooks/useCreateUser"
import { useDeactivateSeller } from "../../application/hooks/useDeactivateSeller"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
                  <button
                    onClick={() => blockUser.mutate(user.id)}
                    disabled={blockUser.isPending || user.username === "admin"}
                    className="text-xs font-semibold disabled:opacity-50"
                    style={{ color: user.active ? "#DC2626" : "#4a7c00", background: "none", border: "none", cursor: "pointer" }}
                  >
                    {user.active ? "Bloquear" : "Activar"}
                  </button>
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
                <button
                  onClick={() => deactivateSeller.mutate(seller.id)}
                  disabled={deactivateSeller.isPending}
                  className="text-xs font-semibold disabled:opacity-50"
                  style={{ color: seller.active ? "#DC2626" : "#4a7c00", background: "none", border: "none", cursor: "pointer" }}
                >
                  {seller.active ? "Dar baja" : "Reactivar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
