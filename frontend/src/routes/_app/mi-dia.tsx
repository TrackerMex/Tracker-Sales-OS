import { createRoute } from '@tanstack/react-router';
import { appLayoutRoute } from '../_app';
import { MiDiaPage } from '../../modules/mi-dia/presentation/pages/MiDiaPage';

export const miDiaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/mi-dia',
  component: MiDiaPage,
});
