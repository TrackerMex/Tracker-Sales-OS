import { createRoute } from "@tanstack/react-router"
import { appLayoutRoute } from "../_app"
import { ActivitiesPage } from "../../modules/activities/presentation/pages/ActivitiesPage"

export const nuevaActividadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/actividades/nueva",
  validateSearch: (search: Record<string, unknown>): { clientId?: string; clientName?: string; taskTitle?: string; taskId?: string } => ({
    clientId: typeof search.clientId === 'string' ? search.clientId : undefined,
    clientName: typeof search.clientName === 'string' ? search.clientName : undefined,
    taskTitle: typeof search.taskTitle === 'string' ? search.taskTitle : undefined,
    taskId: typeof search.taskId === 'string' ? search.taskId : undefined,
  }),
  component: ActivitiesPage,
})
