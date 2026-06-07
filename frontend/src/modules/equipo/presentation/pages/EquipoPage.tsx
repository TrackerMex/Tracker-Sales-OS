import { useState } from "react"
import type { FormEvent } from "react"
import { useAppStore } from "../../../../shared/store/app.store"
import { UserRole } from "../../../../core/domain/types/common.types"
import { useUsers } from "../../application/hooks/useUsers"
import { useSellers } from "../../application/hooks/useSellers"
import { useBlockUser } from "../../application/hooks/useBlockUser"
import { useCreateSeller } from "../../application/hooks/useCreateSeller"
import { useCreateUser } from "../../application/hooks/useCreateUser"
import { useDeactivateSeller } from "../../application/hooks/useDeactivateSeller"

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
      { onSuccess: () => { setSellerName(""); setSellerProfile("") } }
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
        },
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
            <input
              required
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Nombre"
              className="input"
            />
            <input
              value={sellerProfile}
              onChange={(e) => setSellerProfile(e.target.value)}
              placeholder="Perfil / foco comercial"
              className="input"
            />
            <button type="submit" disabled={createSeller.isPending} className="btn-primary justify-center">
              {createSeller.isPending ? "Guardando..." : "Guardar comercial"}
            </button>
          </form>
        </div>

        {/* Crear usuario */}
        <div className="card p-5">
          <div className="slabel mb-4">Crear usuario</div>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
            <input
              required
              value={userUsername}
              onChange={(e) => setUserUsername(e.target.value)}
              placeholder="Usuario"
              className="input"
            />
            <input
              required
              type="password"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Contraseña"
              className="input"
            />
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nombre completo"
              className="input"
            />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="input"
            >
              <option value="Seller">Comercial</option>
              <option value="Admin">Dirección / Admin</option>
            </select>
            {userRole === "Seller" && (
              <select
                value={userSellerId}
                onChange={(e) => setUserSellerId(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar vendedor</option>
                {sellers?.filter(s => s.active).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button type="submit" disabled={createUser.isPending} className="btn-green justify-center">
              {createUser.isPending ? "Creando..." : "Crear acceso"}
            </button>
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
                    <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>{user.username}</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{user.role}</p>
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
                className="flex items-center justify-between rounded-lg px-3 py-3"
                style={{ background: "#F8FAFC", opacity: seller.active ? 1 : 0.5 }}
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
