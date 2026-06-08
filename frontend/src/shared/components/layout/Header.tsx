import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '../../store/app.store';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':        { title: 'Dashboard',            subtitle: 'Visión ejecutiva de esfuerzo, calidad, pipeline y ventas' },
  '/mi-dia':           { title: 'Mi día',               subtitle: 'Qué debo hacer hoy y qué sigue' },
  '/clientes':         { title: 'Clientes / Prospectos', subtitle: 'Expediente comercial centralizado' },
  '/agenda':           { title: 'Agenda y tareas',       subtitle: 'Compromisos comerciales del día' },
  '/actividades/nueva':{ title: 'Registrar actividad',   subtitle: 'Registro de interacción comercial' },
  '/pipeline':         { title: 'Pipeline',              subtitle: 'Fases comerciales por oportunidad' },
  '/ventas':           { title: 'Ventas',                subtitle: 'Registro de cierre, facturación y origen' },
  '/coaching':         { title: 'Coaching comercial',    subtitle: 'Indicadores para corregir metodología comercial' },
  '/reportes':         { title: 'Reportes Dirección',    subtitle: 'Análisis ejecutivo mensual' },
  '/equipo':           { title: 'Equipo',                subtitle: 'Gestión de usuarios y comerciales' },
  '/configuracion':    { title: 'Configuración',         subtitle: 'Parámetros del sistema' },
  '/import-export':    { title: 'Importar / Exportar',   subtitle: 'Respaldo y migración de datos' },
};

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser, clearAuth } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const route = ROUTE_TITLES[location.pathname];
  const resolvedTitle    = title    ?? route?.title    ?? 'Tracker Sales OS';
  const resolvedSubtitle = subtitle ?? route?.subtitle;

  return (
    <header
      className="flex h-[54px] shrink-0 items-center justify-between border-b bg-white px-5"
      style={{ borderColor: '#E2E8F0' }}
    >
      {/* Left: title + subtitle */}
      <div style={{ lineHeight: 1.2 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{resolvedTitle}</span>
        {resolvedSubtitle && (
          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 10 }}>{resolvedSubtitle}</span>
        )}
      </div>

      {/* Right: global actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => void navigate({ to: '/agenda' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Tarea
        </button>

        <button
          onClick={() => void navigate({ to: '/clientes' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Prospecto
        </button>

        <button
          onClick={() => void navigate({ to: '/actividades/nueva' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            background: '#82bc00', color: '#001524', border: 'none', cursor: 'pointer',
          }}
        >
          Registrar actividad
        </button>

        <div style={{ width: 1, height: 20, background: '#E2E8F0', margin: '0 4px' }} />

        <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>
          {currentUser?.name ?? currentUser?.username}
        </span>

        <button
          onClick={clearAuth}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: 'none', color: '#94A3B8', border: '1px solid #E2E8F0', cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Salir
        </button>
      </div>
    </header>
  );
}
