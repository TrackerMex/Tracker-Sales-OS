import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { ReportsPage } from '@/modules/reports/presentation/pages/ReportsPage';

export const reportesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reportes',
  component: ReportsPage,
});
