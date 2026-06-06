import { Link } from '@tanstack/react-router';
import { useAppStore } from '../../store/app.store';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/mi-dia', label: 'Mi día' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/agenda', label: 'Agenda y tareas' },
  { to: '/actividades/nueva', label: 'Registrar actividad' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/coaching', label: 'Coaching comercial' },
  { to: '/reportes', label: 'Reportes' },
  { to: '/equipo', label: 'Equipo comercial' },
  { to: '/configuracion', label: 'Configuración' },
];

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 overflow-y-auto bg-[#002B49] text-white">
      <div className="flex h-20 items-center px-6">
        <span className="text-sm font-black uppercase tracking-widest text-[#82bc00]">
          Tracker Sales OS
        </span>
      </div>
      <nav className="px-4 pb-8">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="mb-1 block rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-300 transition-colors hover:bg-white/10 hover:text-white [&.active]:bg-[#82bc00] [&.active]:text-[#002B49]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
