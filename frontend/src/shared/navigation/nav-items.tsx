import * as React from "react"
import type { UserRole } from "@/core/domain/types/common.types"
import {
  BarChartIcon,
  CalendarIcon,
  DashboardIcon,
  DocumentTextIcon,
  DollarIcon,
  DownloadIcon,
  EditIcon,
  KanbanIcon,
  SettingsIcon,
  SunIcon,
  TeamIcon,
  UsersIcon,
} from "@/shared/components/Icon"

export interface NavItemDef {
  to: string
  label: string
  roles: UserRole[]
  icon: React.ReactNode
}

export const NAV_SECTIONS: { header: string; items: NavItemDef[] }[] = [
  {
    header: "Principal",
    items: [
      {
        to: "/dashboard",
        label: "Dashboard",
        roles: ["Admin", "Director"],
        icon: <DashboardIcon />,
      },
      {
        to: "/mi-dia",
        label: "Mi día",
        roles: ["Admin", "Director", "Seller"],
        icon: <SunIcon />,
      },
    ],
  },
  {
    header: "Gestión",
    items: [
      {
        to: "/clientes",
        label: "Clientes",
        roles: ["Admin", "Director", "Seller"],
        icon: <UsersIcon />,
      },
      {
        to: "/agenda",
        label: "Agenda y tareas",
        roles: ["Admin", "Director", "Seller"],
        icon: <CalendarIcon />,
      },
      {
        to: "/actividades/nueva",
        label: "Registrar actividad",
        roles: ["Admin", "Director", "Seller"],
        icon: <EditIcon />,
      },
      {
        to: "/pipeline",
        label: "Pipeline",
        roles: ["Admin", "Director", "Seller"],
        icon: <KanbanIcon />,
      },
      {
        to: "/ventas",
        label: "Ventas",
        roles: ["Admin", "Director", "Seller"],
        icon: <DollarIcon />,
      },
    ],
  },
  {
    header: "Análisis",
    items: [
      {
        to: "/coaching",
        label: "Coaching comercial",
        roles: ["Admin", "Director", "Seller"],
        icon: <BarChartIcon />,
      },
      {
        to: "/reportes",
        label: "Reportes",
        roles: ["Admin", "Director"],
        icon: <DocumentTextIcon />,
      },
    ],
  },
  {
    header: "Configuración",
    items: [
      {
        to: "/equipo",
        label: "Equipo comercial",
        roles: ["Admin", "Director"],
        icon: <TeamIcon />,
      },
      {
        to: "/configuracion",
        label: "Configuración",
        roles: ["Admin", "Director", "Seller"],
        icon: <SettingsIcon />,
      },
      {
        to: "/import-export",
        label: "Import / Export",
        roles: ["Admin"],
        icon: <DownloadIcon />,
      },
    ],
  },
]
