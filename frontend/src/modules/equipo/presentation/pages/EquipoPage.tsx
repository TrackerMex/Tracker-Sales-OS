import { useAppStore } from '../../../../shared/store/app.store';
import { UserRole } from '../../../../core/domain/types/common.types';
import { useUsers } from '../../application/hooks/useUsers';
import { useSellers } from '../../application/hooks/useSellers';
import { useBlockUser } from '../../application/hooks/useBlockUser';

export function EquipoPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const { data: usersData, isLoading: loadingUsers } = useUsers();
  const { data: sellers, isLoading: loadingSellers } = useSellers();
  const blockUser = useBlockUser();

  if (currentUser?.role === UserRole.Seller) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Acceso denegado</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-black text-[#002B49]">Equipo Comercial</h2>

      {/* Usuarios */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-700">Usuarios</h3>
        {loadingUsers ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Usuario</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.data.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {user.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">{user.username}</td>
                    <td className="px-3 py-2">{user.name}</td>
                    <td className="px-3 py-2">{user.role}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {user.active ? 'Activo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {currentUser?.role === UserRole.Admin && (
                        <button
                          onClick={() => blockUser.mutate(user.id)}
                          disabled={blockUser.isPending}
                          className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: user.active ? '#dc2626' : '#16a34a' }}
                        >
                          {user.active ? 'Bloquear' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersData && (
              <p className="mt-2 text-xs text-slate-400">
                Total: {usersData.total} usuarios
              </p>
            )}
          </div>
        )}
      </section>

      {/* Sellers */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-slate-700">Sellers</h3>
        {loadingSellers ? (
          <p className="text-sm text-slate-400">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Perfil</th>
                  <th className="px-3 py-2">Usuario ID</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sellers?.map((seller) => (
                  <tr key={seller.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {seller.id.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">{seller.name}</td>
                    <td className="px-3 py-2 text-slate-500">{seller.profile ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-400">
                      {seller.userId ? seller.userId.slice(0, 8) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          seller.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {seller.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
