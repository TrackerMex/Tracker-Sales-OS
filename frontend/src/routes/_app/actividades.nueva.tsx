import { createRoute } from "@tanstack/react-router"
import { appLayoutRoute } from "../_app"
import { ActivitiesPage } from "../../modules/activities/presentation/pages/ActivitiesPage"

export const nuevaActividadRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/actividades/nueva",
  component: ActivitiesPage,
})
