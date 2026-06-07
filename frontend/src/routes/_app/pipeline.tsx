import { createRoute } from "@tanstack/react-router"
import { appLayoutRoute } from "../_app"
import { PipelinePage } from "../../modules/pipeline/presentation/pages/PipelinePage"

export const pipelineRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/pipeline",
  component: PipelinePage,
})
