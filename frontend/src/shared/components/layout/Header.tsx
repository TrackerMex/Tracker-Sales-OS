import { useLocation, useNavigate } from "@tanstack/react-router"
import { useAppStore } from "../../store/app.store"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Visión ejecutiva de esfuerzo, calidad, pipeline y ventas",
  },
  "/mi-dia": { title: "Mi día", subtitle: "Qué debo hacer hoy y qué sigue" },
  "/clientes": {
    title: "Clientes / Prospectos",
    subtitle: "Expediente comercial centralizado",
  },
  "/agenda": {
    title: "Agenda y tareas",
    subtitle: "Compromisos comerciales del día",
  },
  "/actividades/nueva": {
    title: "Registrar actividad",
    subtitle: "Registro de interacción comercial",
  },
  "/pipeline": {
    title: "Pipeline",
    subtitle: "Fases comerciales por oportunidad",
  },
  "/ventas": {
    title: "Ventas",
    subtitle: "Registro de cierre, facturación y origen",
  },
  "/coaching": {
    title: "Coaching comercial",
    subtitle: "Indicadores para corregir metodología comercial",
  },
  "/reportes": {
    title: "Reportes Dirección",
    subtitle: "Análisis ejecutivo mensual",
  },
  "/equipo": { title: "Equipo", subtitle: "Gestión de usuarios y comerciales" },
  "/configuracion": {
    title: "Configuración",
    subtitle: "Parámetros del sistema",
  },
  "/import-export": {
    title: "Importar / Exportar",
    subtitle: "Respaldo y migración de datos",
  },
}

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { currentUser, clearAuth } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()

  const route = ROUTE_TITLES[location.pathname]
  const resolvedTitle = title ?? route?.title ?? "Tracker Sales OS"
  const resolvedSubtitle = subtitle ?? route?.subtitle

  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between border-b border-tracker-border bg-white px-4">
      {/* Left: sidebar toggle + title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="leading-tight">
          <span className="text-sm font-bold text-tracker-text">
            {resolvedTitle}
          </span>
          {resolvedSubtitle && (
            <span className="ml-2.5 hidden text-[11px] text-tracker-text-muted md:inline">
              {resolvedSubtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: quick actions (desktop only) */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            onClick={() => void navigate({ to: "/agenda" })}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Tarea
          </Button>

          <Button
            variant="ghost"
            onClick={() => void navigate({ to: "/clientes" })}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Prospecto
          </Button>

          <Button
            variant="success"
            onClick={() => void navigate({ to: "/actividades/nueva" })}
          >
            Registrar actividad
          </Button>

          <div className="mx-1 h-5 w-px bg-tracker-border" />

          <span className="text-xs font-medium text-tracker-text-secondary">
            {currentUser?.name ?? currentUser?.username}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            clearAuth()
            void navigate({ to: "/login" })
          }}
          aria-label="Cerrar sesión"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span className="hidden md:inline">Salir</span>
        </Button>
      </div>
    </header>
  )
}
