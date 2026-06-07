import { createRoute } from '@tanstack/react-router'
import { appLayoutRoute } from '../_app'
import { AgendaPage } from '../../modules/tasks/presentation/pages/AgendaPage'

export const agendaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/agenda',
  component: AgendaPage,
})
