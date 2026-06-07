import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { SalesPage } from '../../modules/sales/presentation/pages/SalesPage';

export const ventasRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/ventas',
  component: SalesPage,
});
