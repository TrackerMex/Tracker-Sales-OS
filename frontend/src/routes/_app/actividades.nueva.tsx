import { createRoute } from "@tanstack/react-router"
import { appLayoutRoute } from "../_app"
import { ActivitiesPage } from "../../modules/activities/presentation/pages/ActivitiesPage"

export const nuevaActividadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/actividades/nueva",
  validateSearch: (search: Record<string, unknown>): { clientId?: string; taskTitle?: string; taskId?: string } => ({
    clientId: typeof search.clientId === 'string' ? search.clientId : undefined,
    taskTitle: typeof search.taskTitle === 'string' ? search.taskTitle : undefined,
    taskId: typeof search.taskId === 'string' ? search.taskId : undefined,
  }),
  component: ActivitiesPage,
})
